import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  color: string;
  left: string;
  animationDelay: string;
  size: string;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

export const Confetti = ({ isActive, duration = 3000 }: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const colors = [
    "hsl(235 85% 65%)", // primary
    "hsl(20 95% 65%)",  // accent
    "hsl(142 85% 55%)", // success
    "hsl(300 85% 65%)", // purple
    "hsl(60 85% 65%)",  // yellow
    "hsl(180 85% 65%)", // cyan
  ];

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = [];
      
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          color: colors[Math.floor(Math.random() * colors.length)],
          left: Math.random() * 100 + "%",
          animationDelay: Math.random() * 3 + "s",
          size: Math.random() * 5 + 5 + "px",
        });
      }
      
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti absolute rounded-full"
          style={{
            backgroundColor: piece.color,
            left: piece.left,
            width: piece.size,
            height: piece.size,
            animationDelay: piece.animationDelay,
          }}
        />
      ))}
    </div>
  );
};