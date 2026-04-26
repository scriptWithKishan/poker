import React from 'react';
import { SuitIcon } from './CardSuit';

interface CardProps {
  suit?: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank?: string;
  size?: 'small' | 'medium' | 'large';
  hidden?: boolean;
}

export function Card({ suit, rank, size = 'medium', hidden = false }: CardProps) {
  if (hidden) {
    return <div className={`card card-back ${size}`}></div>;
  }

  const isRed = suit === 'hearts' || suit === 'diamonds';

  return (
    <div className={`card ${size} ${isRed ? 'red' : 'black'}`}>
      <div className="card-content">
        <div className="card-corner card-top-left">
          <span className="card-rank">{rank}</span>
          <SuitIcon suit={suit!} size={size === 'large' ? 14 : 10} />
        </div>

        <div className="card-center">
          <SuitIcon suit={suit!} size={size === 'large' ? 36 : size === 'medium' ? 28 : 20} />
        </div>

        <div className="card-corner card-bottom-right">
          <span className="card-rank">{rank}</span>
          <SuitIcon suit={suit!} size={size === 'large' ? 14 : 10} />
        </div>
      </div>
    </div>
  );
}
