import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { QuizQuestion } from './QuizGenerator';
import { cn } from '@/lib/utils';

interface QuizDisplayProps {
  questions: QuizQuestion[];
  onReset: () => void;
  className?: string;
}

export const QuizDisplay = ({ questions, onReset, className }: QuizDisplayProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const selectAnswer = (answer: string) => {
    if (isCompleted) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsCompleted(true);
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    return Object.entries(selectedAnswers).reduce((score, [questionIndex, answer]) => {
      return questions[parseInt(questionIndex)]?.correct_answer === answer ? score + 1 : score;
    }, 0);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setIsCompleted(false);
    onReset();
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <Card className={cn("shadow-soft", className)}>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center shadow-glow mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Quiz Complete!</CardTitle>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">{score}/{questions.length}</div>
            <Badge variant={percentage >= 70 ? "default" : "secondary"} className="text-lg px-4 py-1">
              {percentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.correct_answer;
              
              return (
                <Card key={index} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      )}
                      <div className="space-y-2 flex-1">
                        <p className="font-medium">{question.question}</p>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">Your answer:</span>{' '}
                            <span className={isCorrect ? "text-success" : "text-destructive"}>
                              {question.options[userAnswer as keyof typeof question.options]}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p>
                              <span className="font-medium">Correct answer:</span>{' '}
                              <span className="text-success">
                                {question.options[question.correct_answer]}
                              </span>
                            </p>
                          )}
                          <p className="text-muted-foreground">{question.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <Button onClick={resetQuiz} className="w-full" variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Take Another Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card className={cn("shadow-soft", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">Question {currentQuestion + 1} of {questions.length}</Badge>
          <Badge variant="secondary">{question.topic}</Badge>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-gradient-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <CardTitle className="text-lg mb-4">{question.question}</CardTitle>
          <div className="space-y-3">
            {Object.entries(question.options).map(([key, value]) => (
              <Button
                key={key}
                variant="outline"
                className={cn(
                  "w-full justify-start text-left h-auto p-4 hover:bg-quiz-hover transition-colors",
                  selectedAnswers[currentQuestion] === key && "border-primary bg-primary/5"
                )}
                onClick={() => selectAnswer(key)}
              >
                <span className="font-medium mr-3">{key}.</span>
                <span>{value}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="flex-1"
          >
            Previous
          </Button>
          <Button
            onClick={nextQuestion}
            disabled={!selectedAnswers[currentQuestion]}
            className="flex-1 bg-gradient-accent hover:opacity-90 transition-opacity"
          >
            {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};