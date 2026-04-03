"use client";

interface CategoryCardProps {
  name: string;
  score: number;
  explanation: string;
  fix: string | null;
}

export default function CategoryCard({ name, score, explanation, fix }: CategoryCardProps) {
  const barColor =
    score >= 4 ? 'bg-green' : score === 3 ? 'bg-amber' : 'bg-red';

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg text-text-bright">{name}</h3>
        <span className="font-mono text-sm text-text-dim">{score}/5</span>
      </div>

      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= score ? barColor : 'bg-border'}`}
          />
        ))}
      </div>

      <p className="text-sm text-text-primary leading-relaxed">{explanation}</p>

      {fix && score <= 3 && (
        <p className="text-sm text-amber mt-3 leading-relaxed">
          <span className="font-semibold">Fix:</span> {fix}
        </p>
      )}
    </div>
  );
}
