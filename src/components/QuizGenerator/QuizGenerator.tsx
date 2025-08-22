import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Brain, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import NotesUploader from "./NotesUploader";
import Summary from "./Summary";
import QuizFeedbackComponent from "./QuizFeedback";
import TopicsButton from "./TopicsButton";
import Chatbot from "./Chatbot";

// --- Types ---
export interface QuizQuestion {
  topic: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface QuizFeedback {
  feedback: {
    topic: string;
    question: string;
    user_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }[];
  score: {
    correct: number;
    total: number;
    percentage: number;
    summary: string;
  };
}

interface QuizGeneratorProps {
  onQuizGenerated: (quiz: QuizQuestion[]) => void;
  className?: string;
}

export interface QuizGeneratorRef {
  submitQuizFeedback: (userAnswers: Record<number, string>) => Promise<void>;
}

// --- Component ---
export const QuizGenerator = forwardRef<QuizGeneratorRef, QuizGeneratorProps>(
  ({ onQuizGenerated, className }, ref) => {
    const [notes, setNotes] = useState("");
    const [summary, setSummary] = useState("");
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [quizFeedback, setQuizFeedback] = useState<QuizFeedback | null>(null);

    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

    const { toast } = useToast();

    // --- Load saved notes/summary ---
    useEffect(() => {
      const savedNotes = localStorage.getItem("studyspark-notes");
      const savedSummary = localStorage.getItem("studyspark-summary");
      if (savedNotes) setNotes(savedNotes);
      if (savedSummary) setSummary(savedSummary);
    }, []);

    // --- Save notes ---
    useEffect(() => {
      localStorage.setItem("studyspark-notes", notes);
    }, [notes]);

    // --- Save summary ---
    useEffect(() => {
      if (summary) localStorage.setItem("studyspark-summary", summary);
    }, [summary]);

    // --- Update Topics in LocalStorage ---
    const updateCoveredTopics = (topics: string[]) => {
      try {
        const stored = localStorage.getItem("StudySpark-Topics");
        let studySpark;
        if (stored) {
          studySpark = JSON.parse(stored);
        } else {
          studySpark = { topics: [], covered: {} };
        }

        // Ensure topics list exists
        if (!Array.isArray(studySpark.topics)) {
          studySpark.topics = [];
        }
        if (!studySpark.covered) {
          studySpark.covered = {};
        }

        topics.forEach((topic) => {
          if (!studySpark.topics.includes(topic)) {
            studySpark.topics.push(topic);
          }
          studySpark.covered[topic] = true; // mark as covered
        });

        localStorage.setItem("StudySpark-Topics", JSON.stringify(studySpark));
      } catch (err) {
        console.error("Failed to update StudySpark-Topics:", err);
      }
    };

    // --- Generate Summary ---
    const generateSummary = async () => {
      if (!notes.trim()) return;
      setIsGeneratingSummary(true);
      try {
        const res = await fetch("http://localhost:3001/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: notes }),
        });
        const data = await res.json();
        setSummary(data.summary || "");
        toast({ title: "✅ Summary generated!" });
      } catch {
        toast({
          title: "❌ Failed to generate summary",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingSummary(false);
      }
    };

    // --- Generate Quiz ---
    const generateQuiz = async () => {
      const source = summary.trim() || notes.trim();
      if (!source) return;
      setIsGeneratingQuiz(true);
      setQuizFeedback(null);

      try {
        const res = await fetch("http://localhost:3001/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: source }),
        });
        const data = await res.json();
        if (data.questions && Array.isArray(data.questions)) {
          setQuiz(data.questions);
          onQuizGenerated(data.questions);
          toast({
            title: `📝 Quiz Generated: ${data.questions.length} questions`,
          });
        }
      } catch {
        toast({
          title: "❌ Failed to generate quiz",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingQuiz(false);
      }
    };

    // --- Submit Quiz Feedback ---
    const submitQuizFeedback = async (userAnswers: Record<number, string>) => {
      if (!quiz) {
        toast({
          title: "⚠️ No quiz to submit",
          variant: "destructive",
        });
        return;
      }

      setIsGeneratingFeedback(true);

      try {
        const res = await fetch("http://localhost:3001/api/quiz-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: quiz, userAnswers }),
        });
        const data: QuizFeedback = await res.json();
        setQuizFeedback(data);

        // 🔑 Update topics in localStorage after quiz
        const coveredTopics = quiz.map((q) => q.topic);
        updateCoveredTopics(coveredTopics);

        toast({ title: "🎉 Feedback Ready! Topics updated." });
      } catch {
        toast({
          title: "❌ Failed to get feedback",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingFeedback(false);
      }
    };

    // Expose submit function to parent
    useImperativeHandle(ref, () => ({
      submitQuizFeedback,
    }));

    return (
      <Card className={cn("shadow-soft", className)}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center shadow-soft mb-4">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl font-bold">
            StudySpark Assistant
          </CardTitle>
          <p className="text-muted-foreground">
            Upload notes → Generate Summary → Take Quiz → Get Feedback
          </p>
        </CardHeader>

        <CardContent className="flex gap-5">
          {/* Left Half */}
          <div className="w-1/3">
            <TopicsButton pdfName={"StudySpark-Topics"} pdfText={notes} />
          </div>

          {/* Right Half */}
          <div className="w-2/3 space-y-6">
            <NotesUploader
              notes={notes}
              setNotes={setNotes}
              setIsGenerating={() => {}}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={generateSummary}
                disabled={!notes.trim() || isGeneratingSummary}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" /> Generate Summary
                  </>
                )}
              </Button>

              <Button
                onClick={generateQuiz}
                disabled={!(summary.trim() || notes.trim()) || isGeneratingQuiz}
                className="flex-1 bg-gradient-accent hover:opacity-90 shadow-glow"
              >
                {isGeneratingQuiz ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Take Quiz
                  </>
                )}
              </Button>
            </div>

            {/* Summary */}
            {isGeneratingSummary ? (
              <div className="text-center text-blue-600 font-semibold">
                Generating Summary...
              </div>
            ) : (
              <Summary summary={summary} />
            )}

            {/* Feedback */}
            {isGeneratingFeedback ? (
              <div className="text-center text-blue-600 font-semibold">
                Generating Feedback...
              </div>
            ) : (
              <QuizFeedbackComponent quizFeedback={quizFeedback} />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
