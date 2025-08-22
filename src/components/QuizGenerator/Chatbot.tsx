import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { marked } from "marked";
import { motion } from "framer-motion";
import { XCircleIcon, MessageCircleIcon, Loader2 } from "lucide-react";

type Message = {
  text: string;
  type: "user" | "bot";
  timestamp: string;
  loading?: boolean;
};

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const getTimestamp = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const addMessage = (
    text: string,
    type: "user" | "bot",
    isLoading = false
  ) => {
    setMessages((prev) => [
      ...prev,
      { text, type, timestamp: getTimestamp(), loading: isLoading },
    ]);
  };

  const handleSendMessage = async (userInput?: string) => {
    const messageToSend = userInput ?? input.trim();
    if (!messageToSend) return;

    if (!userInput) {
      addMessage(messageToSend, "user");
      setInput("");
    }

    await fetchResponse(messageToSend);
  };

  const fetchResponse = async (message: string) => {
    try {
      setLoading(true);
      addMessage("...", "bot", true);

      const response = await fetch("http://localhost:3001/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction:
            "You are StudySpark, an academic assistant. Only answer academic questions such as study help, summaries, quizzes, explanations, and exam prep. If asked anything unrelated (shopping, groceries, etc.), politely refuse.",
          message,
        }),
      });

      const data = await response.json();

      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? {
                ...msg,
                text: marked.parse(data.reply) as string,
                loading: false,
              }
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? {
                ...msg,
                text: "⚠️ Error: Could not reach the server.",
                loading: false,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-purple-500 text-white p-3 rounded-full shadow-lg hover:bg-purple-600 transition z-[9999]"
      >
        {isOpen ? <XCircleIcon size={24} /> : <MessageCircleIcon size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed right-6 bottom-20 w-96 bg-white border border-gray-300 rounded-2xl shadow-xl z-40 flex flex-col"
          style={{ height: "30rem" }}
        >
          {/* Header */}
          <div className="bg-purple-500 text-white text-center py-3 font-bold rounded-t-2xl shadow-md">
            📚 Academic Assistant
          </div>

          {/* Chat Box */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${
                  msg.type === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                    msg.type === "user"
                      ? "bg-purple-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {msg.loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                      className="prose prose-sm max-w-none"
                    />
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  {msg.timestamp}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center border-t border-gray-200 p-2 bg-white rounded-b-2xl">
            <input
              type="text"
              className="input input-bordered flex-1 text-sm p-2 rounded-lg border-gray-300"
              placeholder="Ask an academic question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button
              className="ml-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
              onClick={() => handleSendMessage()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Send"
              )}
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Chatbot;
