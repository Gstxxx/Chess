import React from 'react';
import {
  Crown,
  Castle,
  Cross,
  ChevronUp,
  Horse1,
} from 'lucide-react';
import type { PieceType } from '../types/chess';

interface PieceProps {
  type: PieceType;
  color: 'white' | 'black';
}

export function Piece({ type, color }: PieceProps) {
  const iconProps = {
    size: 32,
    className: color === 'white' ? 'text-white' : 'text-gray-900',
    strokeWidth: 2,
  };

  const icons = {
    king: <Crown {...iconProps} />,
    queen: <Crown {...iconProps} size={28} />,
    rook: <Castle {...iconProps} />,
    bishop: <Cross {...iconProps} />,
    knight: <Horse1 {...iconProps} />,
    pawn: <ChevronUp {...iconProps} />,
  };

  return icons[type];
}