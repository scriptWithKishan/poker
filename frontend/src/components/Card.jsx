import { RED_SUITS, SUIT_SYMBOLS } from '../data/cards'

/*
  Card is a visual-only component for a single playing card.
  It accepts either a real card object or a hidden/empty state so the table can
  show hole cards, card backs, and community placeholders with the same layout.
*/
export default function Card({ card, hidden = false, small = false }) {
  const className = ['card', small ? 'card--small' : '', card && RED_SUITS.has(card.suit) ? 'card--red' : '']
    .filter(Boolean)
    .join(' ')

  if (hidden) {
    return <div className={`${className} card--back`}>?</div>
  }

  if (!card) {
    return <div className={`${className} card--empty`}></div>
  }

  return (
    <div className={className} aria-label={`${card.rank} of ${card.suit}`}>
      <strong>{card.rank}</strong>
      <span>{SUIT_SYMBOLS[card.suit]}</span>
    </div>
  )
}
