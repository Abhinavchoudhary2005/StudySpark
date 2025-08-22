import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Brain, FileText, Upload, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { marked } from "marked";

// pdfjs worker
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface QuizQuestion {
  topic: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
}

interface QuizFeedback {
  score: number;
  total: number;
  feedback: string;
}

interface QuizGeneratorProps {
  onQuizGenerated: (quiz: QuizQuestion[]) => void;
  className?: string;
}

export const QuizGenerator = ({
  onQuizGenerated,
  className,
}: QuizGeneratorProps) => {
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<QuizFeedback | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Restore from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("studyspark-notes");
    const savedSummary = localStorage.getItem("studyspark-summary");
    if (savedNotes) setNotes(savedNotes);
    if (savedSummary) setSummary(savedSummary);
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem("studyspark-notes", notes);
  }, [notes]);

  useEffect(() => {
    if (summary) localStorage.setItem("studyspark-summary", summary);
  }, [summary]);

  // --- PDF Upload ---
  const handleFileUpload = async (file: File) => {
    try {
      setIsGenerating(true);
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedArray = new Uint8Array(this.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let textContent = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          const pageText = text.items
            .map((item) => ("str" in item ? (item as TextItem).str : ""))
            .join(" ");
          textContent += `\n\n${pageText}`;
        }

        const mergedNotes = [notes.trim(), textContent.trim()]
          .filter(Boolean)
          .join("\n\n");
        setNotes(mergedNotes);

        toast({
          title: "PDF Uploaded",
          description: `Extracted ${pdf.numPages} pages and merged with your notes.`,
        });

        setIsGenerating(false);
      };
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading PDF:", error);
      toast({
        title: "PDF Upload Failed",
        description: "Could not extract text from the file.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  // --- Generate Summary ---
  const generateSummary = async () => {
    if (!notes.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("http://localhost:3001/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes.trim() }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const data = await response.json();
      setSummary(data.summary);

      toast({
        title: "Summary Generated!",
        description: "Your notes have been summarized.",
      });
    } catch (error) {
      console.error("Error summarizing:", error);
      toast({
        title: "Summary Failed",
        description: "Could not generate summary.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Generate Quiz ---
  const generateQuiz = async () => {
    const source = summary.trim() || notes.trim();
    if (!source) return;

    setIsGenerating(true);
    try {
      const response = await fetch("http://localhost:3001/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: source }),
      });

      if (!response.ok) throw new Error("Failed to generate quiz");

      const data = await response.json();
      if (data.questions && Array.isArray(data.questions)) {
        onQuizGenerated(data.questions);
        toast({
          title: "Quiz Generated!",
          description: `Created ${data.questions.length} questions.`,
        });
      } else {
        throw new Error("Invalid quiz format received");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate quiz.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Submit Quiz Feedback ---
  const submitQuizFeedback = async (userAnswers: Record<number, string>) => {
    try {
      const response = await fetch("http://localhost:3001/api/quiz-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: userAnswers }),
      });

      if (!response.ok) throw new Error("Failed to get feedback");

      const data: QuizFeedback = await response.json();
      setQuizFeedback(data);

      toast({
        title: "Feedback Ready!",
        description: "Your quiz results have been analyzed.",
      });
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({
        title: "Feedback Failed",
        description: "Could not analyze quiz results.",
        variant: "destructive",
      });
    }
  };

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
          Upload your notes or PDF → Generate a Summary → Take a Quiz → Get
          Feedback
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notes + PDF Upload */}
        <div className="space-y-2">
          <label
            htmlFor="notes"
            className="text-sm font-medium flex items-center gap-2"
          >
            <FileText className="h-4 w-4" /> Your Study Notes
          </label>

          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25",
              "hover:border-primary hover:bg-primary/5 cursor-pointer"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const files = Array.from(e.dataTransfer.files);
              if (files.length > 0) handleFileUpload(files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload PDF</span> or drag
              and drop
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) =>
              e.target.files?.[0] && handleFileUpload(e.target.files[0])
            }
            className="hidden"
          />

          <Textarea
            id="notes"
            placeholder="Paste your notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[200px] resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={generateSummary}
            disabled={!notes.trim() || isGenerating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <BookOpen className="mr-2 h-4 w-4" /> Generate Summary
          </Button>
          <Button
            onClick={generateQuiz}
            disabled={!(summary.trim() || notes.trim()) || isGenerating}
            className="flex-1 bg-gradient-accent hover:opacity-90 shadow-glow"
          >
            <Sparkles className="mr-2 h-4 w-4" /> Take Quiz
          </Button>
        </div>

        {/* Summary Output */}
        {summary && (
          <div className="p-4 border rounded-lg bg-muted/50 text-sm text-left whitespace-pre-line">
            <h3 className="font-semibold mb-2">📘 Summary:</h3>
            <div
              dangerouslySetInnerHTML={{
                __html: marked.parse(summary) as string,
              }}
            />
          </div>
        )}

        {/* Quiz Feedback */}
        {quizFeedback && (
          <div className="p-4 border rounded-lg bg-green-50 text-sm">
            <h3 className="font-semibold mb-2">✅ Quiz Feedback</h3>
            <p>
              Score: {quizFeedback.score}/{quizFeedback.total}
            </p>
            <p className="mt-2">{quizFeedback.feedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
