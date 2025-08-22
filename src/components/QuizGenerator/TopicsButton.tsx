import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

interface ProgressTrackerProps {
  pdfName: string; // Name of the PDF file
  pdfText: string; // Extracted text from the PDF
}

export default function ProgressTracker({
  pdfName,
  pdfText,
}: ProgressTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [covered, setCovered] = useState<Record<string, boolean>>({});

  // Load topics & progress from localStorage
  useEffect(() => {
    const savedTopics = localStorage.getItem(pdfName);
    if (savedTopics) {
      try {
        const parsed = JSON.parse(savedTopics);
        setTopics(parsed.topics || []);
        setCovered(parsed.covered || {});
      } catch {
        console.error("Failed to parse saved topics.");
      }
    }
  }, [pdfName]);

  // Save progress to localStorage whenever topics or covered changes
  useEffect(() => {
    if (topics.length > 0) {
      localStorage.setItem(pdfName, JSON.stringify({ topics, covered }));
    }
  }, [topics, covered, pdfName]);

  const handleFetchTopics = async () => {
    if (!pdfText || pdfText.trim().length === 0) {
      alert("No text found in PDF.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/api/list-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pdfText }),
      });
      if (!res.ok) throw new Error("Failed to fetch topics");
      const data = await res.json();
      if (data.topics && Array.isArray(data.topics)) {
        setTopics(data.topics);
        setCovered({}); // reset covered state for new topics
        alert(`✅ Topics loaded for ${pdfName}`);
      } else {
        alert("❌ No topics found.");
      }
    } catch (err) {
      console.error("Error fetching topics:", err);
      alert("Failed to fetch topics.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCovered = (topic: string) => {
    setCovered((prev) => ({ ...prev, [topic]: !prev[topic] }));
  };

  const progress = topics.length
    ? Math.round(
        (Object.values(covered).filter(Boolean).length / topics.length) * 100
      )
    : 0;

  return (
    <Card className="p-4 shadow-lg border rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📑 Progress Tracker </span>
          <Button onClick={handleFetchTopics} disabled={loading}>
            {loading ? "Extracting..." : "🔍 Load Topics"}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {topics.length === 0 ? (
          <p className="text-gray-600 italic">No topics loaded yet.</p>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mb-4 text-sm font-medium">
              Progress: {progress}% (
              {Object.values(covered).filter(Boolean).length} / {topics.length}{" "}
              covered)
            </p>

            {/* Topics List */}
            <ul className="space-y-2">
              {topics.map((t, i) => (
                <li
                  key={i}
                  onClick={() => toggleCovered(t)}
                  className={`cursor-pointer flex items-center gap-2 p-2 rounded-lg border transition ${
                    covered[t]
                      ? "bg-green-50 border-green-300 text-green-800"
                      : "bg-white hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  {covered[t] ? (
                    <CheckCircle2 className="text-green-600" size={20} />
                  ) : (
                    <Circle className="text-gray-400" size={20} />
                  )}
                  <span className="text-sm">{t}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
