import React from 'react';

interface CardSuitProps {
  className?: string;
  size?: number;
}

export function CardSuit({ className = '', size = 32 }: CardSuitProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      {/* Diamond */}
      <path
        d="M16 2L24 14L16 26L8 14L16 2Z"
        fill="var(--accent)"
      />
      {/* Heart */}
      <path
        d="M16 6C16 6 12 2 8 6C4 10 8 14 16 22C24 14 28 10 24 6C20 2 16 6 16 6Z"
        fill="var(--accent)"
        opacity="0.6"
      />
      {/* Spade */}
      <path
        d="M16 8C16 8 20 4 24 8C28 12 16 20 16 20C16 20 4 12 8 8C12 4 16 8 16 8Z"
        fill="var(--text)"
        opacity="0.4"
        transform="translate(4, 8)"
      />
    </svg>
  );
}

export function SuitIcon({ suit, className = '', size = 20 }: { suit: string; className?: string; size?: number }) {
  const suitPaths = {
    hearts: 'M10 3C10 3 6 0 3 3C0 6 3 9 10 17C17 9 20 6 17 3C14 0 10 3 10 3Z',
    diamonds: 'M10 1L17 10L10 19L3 10L10 1Z',
    clubs: 'M10 14C12 14 14 12 14 10C14 8 12 6 10 6C8 6 6 8 6 10C6 12 8 14 10 14ZM10 14V19M7 16H13',
    spades: 'M10 4C10 4 14 1 17 4C20 7 10 15 10 15C10 15 0 7 3 4C6 1 10 4 10 4ZM10 15V19',
  };

  const colors = {
    hearts: '#ef4444',
    diamonds: '#ef4444',
    clubs: '#1f2937',
    spades: '#1f2937',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={colors[suit as keyof typeof colors] || '#1f2937'}
      className={className}
    >
      <path d={suitPaths[suit as keyof typeof suitPaths] || suitPaths.spades} />
    </svg>
  );
}
