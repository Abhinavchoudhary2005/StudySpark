import { QuizFeedback } from "./QuizGenerator";

interface QuizFeedbackProps {
  quizFeedback: QuizFeedback | null;
}

export default function QuizFeedbackComponent({
  quizFeedback,
}: QuizFeedbackProps) {
  if (!quizFeedback) return null;

  const { feedback, score } = quizFeedback;
  const scorePercentage = score.percentage;
  const scoreColor =
    scorePercentage >= 80
      ? "text-green-800 bg-green-100 border-green-300"
      : scorePercentage >= 50
      ? "text-yellow-800 bg-yellow-100 border-yellow-300"
      : "text-red-800 bg-red-100 border-red-300";

  return (
    <div className={`p-4 border rounded-lg text-sm ${scoreColor}`}>
      <h3 className="font-bold text-lg mb-2">✅ Quiz Feedback</h3>
      <p className="font-semibold">
        Score: {score.correct} / {score.total} ({scorePercentage.toFixed(1)}%)
      </p>
      <p className="mt-2 mb-4 font-medium">{score.summary}</p>
      <div className="space-y-3">
        {feedback.map((q, idx) => (
          <div
            key={idx}
            className={`p-3 border rounded ${
              q.is_correct ? "bg-green-50" : "bg-red-50"
            }`}
          >
            <p className="font-semibold">
              [{q.topic}] {q.question}
            </p>
            <p>Your answer: {q.user_answer || "Not answered"}</p>
            <p>Correct answer: {q.correct_answer}</p>
            <p className="text-sm mt-1">{q.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
