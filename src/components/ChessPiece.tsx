import type { PieceType } from "../types/chess";
import { useEffect, useState } from "react";

interface ChessPieceProps {
  type: PieceType;
  color: "white" | "black";
  position: { x: number; y: number };
  isCapturing?: boolean;
  onDragStart?: () => void;
  onDragEnd?: (dropPosition: { x: number; y: number } | null) => void;
}

const pieceImages = {
  king: "https://play.rosebud.ai/assets/King.png?gzNf",
  queen: "https://play.rosebud.ai/assets/queen.png?bQ51",
  rook: "https://play.rosebud.ai/assets/medieval%20tower.png?4eaw",
  bishop: "https://play.rosebud.ai/assets/bishop.png?4QWq",
  knight: "https://play.rosebud.ai/assets/medieval%20horse.png?klnL",
  pawn: "https://play.rosebud.ai/assets/medieval%20pawn.png?Mvug",
};

export function ChessPiece({
  type,
  color,
  position,
  isCapturing,
  onDragStart,
  onDragEnd,
}: ChessPieceProps) {
  const [prevPosition, setPrevPosition] = useState(position);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (prevPosition.x !== position.x || prevPosition.y !== position.y) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setPrevPosition(position);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [position, prevPosition]);

  const translateX = (position.x - prevPosition.x) * 96;
  const translateY = (position.y - prevPosition.y) * 96;

  const handleDragStart = (e: React.DragEvent) => {
    // Create a smaller drag preview
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to 48x48 (half the original size)
    canvas.width = 48;
    canvas.height = 48;

    // Create temporary image for drawing
    const img = new Image();
    img.src = pieceImages[type];

    // Once image loads, draw scaled version to canvas
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 48, 48);
    };

    // Set the drag preview to our scaled canvas
    e.dataTransfer.setDragImage(canvas, 24, 24);

    // Store the piece's position
    e.dataTransfer.setData("text/plain", JSON.stringify(position));
    onDragStart?.();
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!e.dataTransfer.dropEffect || e.dataTransfer.dropEffect === "none") {
      onDragEnd?.(null);
      return;
    }
  };

  return (
    <div
      className={`w-24 h-24 relative ${
        color === "black" ? "grayscale" : "sepia"
      }`}
      style={{
        transform: isAnimating
          ? `translate(${translateX}px, ${translateY}px)`
          : "none",
        transition: isCapturing
          ? "opacity 400ms ease-in-out, transform 400ms ease-in-out, scale 400ms ease-in-out"
          : "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        opacity: isCapturing ? 0 : 1,
        scale: isCapturing ? 0.5 : 1,
        willChange: "transform",
      }}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <img
        src={pieceImages[type]}
        alt={`${color} ${type}`}
        className="w-full h-full object-contain pointer-events-none"
        style={{
          filter: isAnimating
            ? "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
            : "none",
          transition: "filter 400ms ease-in-out",
        }}
        draggable={false}
      />
    </div>
  );
}
