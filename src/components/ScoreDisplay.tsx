interface ScoreDisplayProps {
  score: number;
  status: string;
}

export default function ScoreDisplay({ score, status }: ScoreDisplayProps) {
  return (
    <div className={`text-2xl font-bold ${status === 'qualified' ? 'text-green-600' : status === 'maybe' ? 'text-yellow-600' : 'text-red-600'}`}>
      {score.toFixed(1)}/100 - {status.toUpperCase()}
    </div>
  );
}