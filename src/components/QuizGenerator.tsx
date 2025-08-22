import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Brain, FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// pdfjs worker (important for browser)
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface QuizQuestion {
  topic: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // --- PDF Upload & Extract ---
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
            .map((item) => {
              if ("str" in item) {
                return (item as TextItem).str;
              }
              return "";
            })
            .join(" ");

          textContent += `\n\n${pageText}`;
        }

        // Merge PDF content with textarea notes
        const mergedNotes = [notes.trim(), textContent.trim()]
          .filter(Boolean)
          .join("\n\n");

        setNotes(mergedNotes);

        toast({
          title: "PDF Uploaded",
          description: `Extracted ${pdf.numPages} pages from PDF and merged with your notes.`,
        });

        setIsGenerating(false);
      };

      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading PDF:", error);
      toast({
        title: "PDF Upload Failed",
        description: "Could not extract text from the file. Try another PDF.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // --- Generate Quiz ---
  const generateQuiz = async () => {
    if (!notes.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch("http://localhost:3001/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "An unknown error occurred." }));
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      if (data.questions && Array.isArray(data.questions)) {
        onQuizGenerated(data.questions);
        toast({
          title: "Quiz Generated!",
          description: `Successfully created ${data.questions.length} questions from your notes.`,
        });
      } else {
        throw new Error("Invalid quiz format received from the server.");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Generation Failed",
        description:
          error.message ||
          "An unexpected error occurred. Please check the console and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={cn("shadow-soft", className)}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center shadow-soft mb-4">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl font-bold">AI Quiz Generator</CardTitle>
        <p className="text-muted-foreground">
          Paste your notes below or upload a PDF and let StudySpark create a
          personalized quiz
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="notes"
            className="text-sm font-medium flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Your Study Notes
          </label>

          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25",
              "hover:border-primary hover:bg-primary/5 cursor-pointer"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload PDF</span> or drag
              and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Or paste your notes in the text area below)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Textarea
            id="notes"
            placeholder="Paste your notes here... StudySpark will analyze them and create targeted questions."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[200px] resize-none"
          />
        </div>

        <Button
          onClick={generateQuiz}
          disabled={!notes.trim() || isGenerating}
          className="w-full bg-gradient-accent hover:opacity-90 transition-opacity shadow-glow"
          size="lg"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Quiz
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
