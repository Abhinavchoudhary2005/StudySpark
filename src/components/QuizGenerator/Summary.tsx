import { marked } from "marked";

interface SummaryProps {
  summary: string;
}

export default function Summary({ summary }: SummaryProps) {
  if (!summary) return null;

  return (
    <div className="p-4 border rounded-lg bg-muted/50 text-sm text-left whitespace-pre-line">
      <h3 className="font-semibold mb-2">📘 Summary:</h3>
      <div
        dangerouslySetInnerHTML={{ __html: marked.parse(summary) as string }}
      />
    </div>
  );
}
