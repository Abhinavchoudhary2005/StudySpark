import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizGenerator } from "@/components/QuizGenerator/QuizGenerator";
import type { QuizQuestion } from "@/components/QuizGenerator/types";

import { Sparkles, Brain, Upload, BookOpen, Zap } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { QuizDisplay } from "@/components/QuizGenerator/QuizDisplay";

const Index = () => {
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(
    null
  );

  const handleQuizGenerated = (quiz: QuizQuestion[]) => {
    setQuizQuestions(quiz);
  };

  const handleQuizReset = () => {
    setQuizQuestions(null);
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center shadow-glow">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">StudySpark</h1>
                <p className="text-sm text-muted-foreground">
                  AI-Powered Quiz Generator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4" />
              <span>AI-Powered Content Creation</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!quizQuestions ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold">
                  Upload <span className="text-primary">PDF's</span> or Paste{" "}
                  <span className="text-primary">Your Notes</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Upload your PDF or paste your notes and let our AI create
                  personalized quizzes! ✨
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <Card className="shadow-soft hover:shadow-glow transition-shadow duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-3">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Easy Upload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Drag & drop your PDF files or browse to select them.
                      Supports all standard PDF formats.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-glow transition-shadow duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center mb-3">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">AI Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes your content and identifies key concepts
                      to create targeted questions.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-glow transition-shadow duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-3">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Instant Quizzes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Get personalized multiple-choice quizzes generated in
                      seconds to test your knowledge.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quiz Generator */}
            <div className="max-w-2xl mx-auto">
              <QuizGenerator onQuizGenerated={handleQuizGenerated} />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <QuizDisplay questions={quizQuestions} onReset={handleQuizReset} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              StudySpark - Transforming learning with AI-powered quiz generation
            </p>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
};

export default Index;
