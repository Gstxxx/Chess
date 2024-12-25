import React from "react";

interface SquareProps {
  isLight: boolean;
  isSelected: boolean;
  isPossibleMove: boolean;
  isPossibleCapture: boolean;
  isCheckingPiece: boolean;
  children?: React.ReactNode;
  onClick: () => void;
  onDrop?: (fromPosition: { x: number; y: number }) => void;
}

export function Square({
  isLight,
  isSelected,
  isPossibleMove,
  isPossibleCapture,
  isCheckingPiece,
  children,
  onClick,
  onDrop,
}: SquareProps) {
  const handleDragOver = (e: React.DragEvent) => {
    if (isPossibleMove || isPossibleCapture) {
      e.preventDefault();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isPossibleMove || isPossibleCapture) {
      const fromPosition = JSON.parse(e.dataTransfer.getData("text/plain"));
      onDrop?.(fromPosition);
    }
  };

  return (
    <div
      className={`
        w-24 h-24 flex items-center justify-center cursor-pointer
        ${isLight ? "bg-zinc-100" : "bg-zinc-800"}
        ${isSelected ? "ring-4 ring-blue-400 ring-inset" : ""}
        ${isPossibleMove ? "border-8 border-green-400" : ""}
        ${isPossibleCapture ? "border-8 border-red-400" : ""}
        ${isCheckingPiece ? "ring-4 ring-red-600 ring-inset" : ""}
        hover:opacity-90
      `}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="transition-all duration-300 ease-in-out">{children}</div>
    </div>
  );
}
