import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export const PDFUpload = ({ onFileSelect, className }: PDFUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      setSelectedFile(pdfFile);
      onFileSelect(pdfFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return (
    <Card className={cn("border-2 border-dashed transition-all duration-200", className)}>
      <CardContent className="p-8">
        <div
          className={cn(
            "text-center transition-colors duration-200",
            isDragOver && "bg-secondary/50 rounded-lg p-4"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-4 bg-secondary rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-soft">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Upload PDF</h3>
                <p className="text-muted-foreground">
                  Choose a PDF file or drag and drop it here
                </p>
              </div>

              <div className="space-y-3">
                <label htmlFor="pdf-upload">
                  <Button 
                    variant="outline" 
                    className="cursor-pointer hover:bg-secondary"
                    asChild
                  >
                    <span>Browse Files</span>
                  </Button>
                </label>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};