import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// pdfjs worker
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface NotesUploaderProps {
  notes: string;
  setNotes: (value: string) => void;
  setIsGenerating: (value: boolean) => void;
}

export default function NotesUploader({
  notes,
  setNotes,
  setIsGenerating,
}: NotesUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  return (
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
          <span className="font-semibold">Click to upload PDF</span> or drag and
          drop
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
  );
}
