// components/QuizGenerator/types.ts
export interface QuizQuestion {
  topic: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface QuizFeedback {
  score: number;
  total: number;
  feedback: string;
}
