import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Brain, FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QuizQuestion {
  topic: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

interface QuizGeneratorProps {
  onQuizGenerated: (quiz: QuizQuestion[]) => void;
  className?: string;
}

export const QuizGenerator = ({ onQuizGenerated, className }: QuizGeneratorProps) => {
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    // For now, we'll just show a message that PDF processing is coming soon
    // In a real implementation, you'd extract text from the PDF here
    toast({
      title: "PDF Upload",
      description: "PDF text extraction will be implemented soon. For now, please copy and paste your notes.",
      variant: "destructive",
    });
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

  const generateQuiz = async () => {
    if (!notes.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          notes: notes.trim(),
          title: 'Generated Quiz'
        }
      });

      if (error) {
        console.error('Error generating quiz:', error);
        toast({
          title: "Generation Failed",
          description: "Failed to generate quiz. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data.questions && Array.isArray(data.questions)) {
        onQuizGenerated(data.questions);
        toast({
          title: "Quiz Generated!",
          description: `Successfully created ${data.questions.length} questions from your notes.`,
        });
      } else {
        throw new Error('Invalid quiz format received');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Generation Failed",
        description: "An error occurred while generating the quiz. Please try again.",
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
          Paste your notes below and let StudySpark create a personalized quiz
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Your Study Notes
          </label>
          
          {/* PDF Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary hover:bg-primary/5 cursor-pointer"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload PDF</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Or paste your notes in the text area below
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
            placeholder="Paste your notes here... StudySpark will analyze them and create targeted questions to test your understanding."
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
              Generating Quiz...
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