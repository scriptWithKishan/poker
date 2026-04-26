export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs']

export const RANKS = [
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 },
  { label: 'J', value: 11 },
  { label: 'Q', value: 12 },
  { label: 'K', value: 13 },
  { label: 'A', value: 14 },
]

export const SUIT_SYMBOLS = {
  spades: 'S',
  hearts: 'H',
  diamonds: 'D',
  clubs: 'C',
}

export const RED_SUITS = new Set(['hearts', 'diamonds'])

/*
  Creates a standard 52-card deck with stable ids.
  Each card stores a human label for the UI and numeric values for hand ranking.
*/
export function createDeck() {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${rank.label}-${suit}`,
      suit,
      rank: rank.label,
      value: rank.value,
    })),
  )
}

/*
  Fisher-Yates shuffle. The function returns a new deck so callers can keep
  game state immutable and predictable inside React state updates.
*/
export function shuffleDeck(deck) {
  const shuffled = [...deck]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled
}
