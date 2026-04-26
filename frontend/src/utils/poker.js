const HAND_NAMES = [
  'High Card',
  'One Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
]

function compareValues(left = [], right = []) {
  const length = Math.max(left.length, right.length)

  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] || 0) - (right[index] || 0)
    if (difference !== 0) return difference
  }

  return 0
}

function getStraightHigh(values) {
  const uniqueValues = [...new Set(values)].sort((a, b) => b - a)
  const wheelValues = uniqueValues.includes(14) ? [...uniqueValues, 1] : uniqueValues

  for (let index = 0; index <= wheelValues.length - 5; index += 1) {
    const window = wheelValues.slice(index, index + 5)
    const isStraight = window.every((value, offset) => offset === 0 || value === window[offset - 1] - 1)

    if (isStraight) {
      return window[0] === 14 && window[4] === 10 ? 14 : window[0]
    }
  }

  return null
}

function rankFiveCards(cards) {
  const values = cards.map((card) => card.value).sort((a, b) => b - a)
  const suits = cards.map((card) => card.suit)
  const flush = suits.every((suit) => suit === suits[0])
  const straightHigh = getStraightHigh(values)
  const groups = Object.values(
    cards.reduce((acc, card) => {
      acc[card.value] = acc[card.value] || { value: card.value, count: 0 }
      acc[card.value].count += 1
      return acc
    }, {}),
  ).sort((a, b) => b.count - a.count || b.value - a.value)

  if (flush && straightHigh) return { rank: 8, values: [straightHigh] }
  if (groups[0].count === 4) {
    const kicker = groups.find((group) => group.count === 1).value
    return { rank: 7, values: [groups[0].value, kicker] }
  }
  if (groups[0].count === 3 && groups[1].count === 2) {
    return { rank: 6, values: [groups[0].value, groups[1].value] }
  }
  if (flush) return { rank: 5, values }
  if (straightHigh) return { rank: 4, values: [straightHigh] }
  if (groups[0].count === 3) {
    const kickers = groups.filter((group) => group.count === 1).map((group) => group.value)
    return { rank: 3, values: [groups[0].value, ...kickers] }
  }
  if (groups[0].count === 2 && groups[1].count === 2) {
    const pairValues = groups.filter((group) => group.count === 2).map((group) => group.value)
    const kicker = groups.find((group) => group.count === 1).value
    return { rank: 2, values: [...pairValues, kicker] }
  }
  if (groups[0].count === 2) {
    const kickers = groups.filter((group) => group.count === 1).map((group) => group.value)
    return { rank: 1, values: [groups[0].value, ...kickers] }
  }

  return { rank: 0, values }
}

function getCombinations(cards, size, start = 0, selected = [], result = []) {
  if (selected.length === size) {
    result.push([...selected])
    return result
  }

  for (let index = start; index < cards.length; index += 1) {
    selected.push(cards[index])
    getCombinations(cards, size, index + 1, selected, result)
    selected.pop()
  }

  return result
}

/*
  Evaluates the best Texas Hold'em hand from two hole cards plus community
  cards. It checks every five-card combination, which is easy to audit and fast
  enough for a small frontend-only table.
*/
export function evaluateSevenCards(cards) {
  const combinations = getCombinations(cards, 5)
  let best = null

  combinations.forEach((combination) => {
    const score = rankFiveCards(combination)

    if (!best || score.rank > best.rank || (score.rank === best.rank && compareValues(score.values, best.values) > 0)) {
      best = { ...score, cards: combination }
    }
  })

  return {
    ...best,
    name: HAND_NAMES[best.rank],
  }
}

export function compareHands(left, right) {
  if (left.rank !== right.rank) return left.rank - right.rank
  return compareValues(left.values, right.values)
}
