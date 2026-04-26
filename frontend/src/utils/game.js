import { createDeck, shuffleDeck } from '../data/cards.js'
import { compareHands, evaluateSevenCards } from './poker.js'

export const STREETS = ['preflop', 'flop', 'turn', 'river', 'showdown']
export const SMALL_BLIND = 10
export const BIG_BLIND = 20
export const STARTING_STACK = 1000

function makePlayer(name, index, userId = '') {
  return {
    id: userId || crypto.randomUUID(),
    userId,
    name: name.trim() || `Player ${index + 1}`,
    stack: STARTING_STACK,
    hand: [],
    folded: false,
    currentBet: 0,
    committed: 0,
    acted: false,
    dealer: false,
  }
}

function draw(deck, count) {
  return {
    cards: deck.slice(0, count),
    deck: deck.slice(count),
  }
}

function nextActiveIndex(players, fromIndex) {
  for (let offset = 1; offset <= players.length; offset += 1) {
    const index = (fromIndex + offset) % players.length
    const player = players[index]
    if (!player.folded && player.stack > 0) return index
  }

  return -1
}

function nextSeatedIndex(players, fromIndex) {
  for (let offset = 1; offset <= players.length; offset += 1) {
    const index = (fromIndex + offset) % players.length
    const player = players[index]
    if (player.stack > 0) return index
  }

  return -1
}

function getHandPlayerIndexes(players) {
  return players.reduce((indexes, player, index) => {
    if (player.stack > 0) indexes.push(index)
    return indexes
  }, [])
}

function resetStreetBets(players) {
  return players.map((player) => ({ ...player, currentBet: 0, acted: false }))
}

function getActivePlayers(players) {
  return players.filter((player) => !player.folded)
}

function getActionablePlayers(players) {
  return players.filter((player) => !player.folded && player.stack > 0)
}

function isBettingRoundComplete(game) {
  const activePlayers = getActionablePlayers(game.players)

  return activePlayers.every((player) => player.acted && player.currentBet === game.currentBet)
}

function dealCommunity(game, count) {
  const drawResult = draw(game.deck, count)

  return {
    ...game,
    deck: drawResult.deck,
    community: [...game.community, ...drawResult.cards],
  }
}

function dealRemainingBoard(game) {
  if (game.community.length >= 5) return game
  return dealCommunity(game, 5 - game.community.length)
}

function awardSingleWinner(game, winnerId, reason) {
  const winner = game.players.find((player) => player.id === winnerId)

  return {
    ...game,
    phase: 'complete',
    winnerText: `${winner.name} wins ${game.pot} chips ${reason}.`,
    players: game.players.map((player) =>
      player.id === winnerId ? { ...player, stack: player.stack + game.pot } : player,
    ),
    pot: 0,
    turnIndex: -1,
  }
}

function finishShowdown(game) {
  const contenders = game.players
    .filter((player) => !player.folded)
    .map((player) => ({
      ...player,
      score: evaluateSevenCards([...player.hand, ...game.community]),
    }))

  const best = contenders.reduce((winner, player) => (compareHands(player.score, winner.score) > 0 ? player : winner))
  const payouts = game.players.reduce((acc, player) => {
    acc[player.id] = 0
    return acc
  }, {})
  const remainingCommitted = game.players.map((player) => ({
    id: player.id,
    committed: player.committed || 0,
  }))

  while (remainingCommitted.some((entry) => entry.committed > 0)) {
    const nextLevel = Math.min(...remainingCommitted.filter((entry) => entry.committed > 0).map((entry) => entry.committed))
    const contributors = remainingCommitted.filter((entry) => entry.committed > 0)
    const potAmount = nextLevel * contributors.length

    contributors.forEach((entry) => {
      entry.committed -= nextLevel
    })

    const eligibleContenders = contenders.filter((player) =>
      contributors.some((contributor) => contributor.id === player.id),
    )
    const potBest = eligibleContenders.reduce((winner, player) =>
      compareHands(player.score, winner.score) > 0 ? player : winner,
    )
    const potWinners = eligibleContenders.filter((player) => compareHands(player.score, potBest.score) === 0)
    const splitAmount = Math.floor(potAmount / potWinners.length)
    const oddChipCount = potAmount % potWinners.length

    potWinners.forEach((winner, index) => {
      payouts[winner.id] += splitAmount + (index < oddChipCount ? 1 : 0)
    })
  }

  const overallWinners = contenders.filter((player) => compareHands(player.score, best.score) === 0)
  const winnerNames = overallWinners.map((player) => player.name).join(', ')

  return {
    ...game,
    phase: 'complete',
    winnerText: `${winnerNames} win with ${best.score.name}.`,
    players: game.players.map((player) => ({
      ...player,
      stack: player.stack + payouts[player.id],
    })),
    pot: 0,
    turnIndex: -1,
    revealedHands: contenders.reduce((acc, player) => {
      acc[player.id] = player.score.name
      return acc
    }, {}),
  }
}

function advanceStreet(game) {
  if (getActivePlayers(game.players).length === 1) {
    return awardSingleWinner(game, getActivePlayers(game.players)[0].id, 'because everyone else folded')
  }

  if (getActionablePlayers(game.players).length <= 1) {
    return finishShowdown(dealRemainingBoard({ ...game, street: 'showdown' }))
  }

  const nextStreet = STREETS[STREETS.indexOf(game.street) + 1]
  let nextGame = {
    ...game,
    street: nextStreet,
    currentBet: 0,
    minRaise: BIG_BLIND,
    players: resetStreetBets(game.players),
  }

  if (nextStreet === 'flop') nextGame = dealCommunity(nextGame, 3)
  if (nextStreet === 'turn' || nextStreet === 'river') nextGame = dealCommunity(nextGame, 1)
  if (nextStreet === 'showdown') return finishShowdown(nextGame)

  if (getActionablePlayers(nextGame.players).length <= 1) {
    return finishShowdown(dealRemainingBoard({ ...nextGame, street: 'showdown' }))
  }

  const firstTurn = nextActiveIndex(nextGame.players, nextGame.dealerIndex)

  return {
    ...nextGame,
    turnIndex: firstTurn,
    log: [`${nextStreet.toUpperCase()} begins.`, ...game.log],
  }
}

function moveTurnOrAdvance(game, fromIndex) {
  if (getActivePlayers(game.players).length === 1) {
    return awardSingleWinner(game, getActivePlayers(game.players)[0].id, 'because everyone else folded')
  }

  if (isBettingRoundComplete(game)) return advanceStreet(game)

  return {
    ...game,
    turnIndex: nextActiveIndex(game.players, fromIndex),
  }
}

/*
  Builds a shareable room shell. This app has no server, so the room id is a
  stable key for local browser storage and a future realtime backend.
*/
export function createRoom(roomId = crypto.randomUUID().slice(0, 8).toUpperCase()) {
  return {
    roomId,
    phase: 'lobby',
    players: [],
    deck: [],
    community: [],
    pot: 0,
    dealerIndex: 0,
    turnIndex: -1,
    street: 'preflop',
    currentBet: 0,
    minRaise: BIG_BLIND,
    winnerText: '',
    revealedHands: {},
    log: [`Room ${roomId} created.`],
  }
}

export function addPlayer(game, name, userId = '') {
  if (game.phase !== 'lobby' || game.players.length >= 8) return game
  if (userId && game.players.some((player) => player.userId === userId)) return game

  return {
    ...game,
    players: [...game.players, makePlayer(name, game.players.length, userId)],
  }
}

export function removePlayer(game, playerId) {
  if (game.phase !== 'lobby') return game

  return {
    ...game,
    players: game.players.filter((player) => player.id !== playerId),
  }
}

export function startHand(game) {
  const handPlayerIndexes = getHandPlayerIndexes(game.players)
  if (handPlayerIndexes.length < 2) return game

  let deck = shuffleDeck(createDeck())
  const dealerIndex = game.phase === 'lobby' ? handPlayerIndexes[0] : nextSeatedIndex(game.players, game.dealerIndex)
  const headsUp = handPlayerIndexes.length === 2
  const smallBlindIndex = headsUp ? dealerIndex : nextSeatedIndex(game.players, dealerIndex)
  const bigBlindIndex = nextSeatedIndex(game.players, smallBlindIndex)

  let players = game.players.map((player, index) => ({
    ...player,
    dealer: index === dealerIndex,
    hand: [],
    folded: player.stack <= 0,
    currentBet: 0,
    committed: 0,
    acted: false,
  }))

  for (let round = 0; round < 2; round += 1) {
    let dealIndex = dealerIndex

    for (let count = 0; count < handPlayerIndexes.length; count += 1) {
      dealIndex = nextActiveIndex(players, dealIndex)
      const result = draw(deck, 1)
      deck = result.deck
      players[dealIndex].hand = [...players[dealIndex].hand, result.cards[0]]
    }
  }

  let pot = 0
  players = players.map((player, index) => {
    const blind = index === smallBlindIndex ? SMALL_BLIND : index === bigBlindIndex ? BIG_BLIND : 0
    const blindPaid = Math.min(player.stack, blind)
    pot += blindPaid

    return {
      ...player,
      currentBet: blindPaid,
      committed: blindPaid,
      stack: player.stack - blindPaid,
    }
  })

  return {
    ...game,
    phase: 'playing',
    players,
    deck,
    community: [],
    pot,
    dealerIndex,
    turnIndex: nextActiveIndex(players, bigBlindIndex),
    street: 'preflop',
    currentBet: Math.max(players[smallBlindIndex].currentBet, players[bigBlindIndex].currentBet),
    minRaise: BIG_BLIND,
    winnerText: '',
    revealedHands: {},
    log: [`New hand started. Blinds are ${SMALL_BLIND}/${BIG_BLIND}.`, ...game.log],
  }
}

export function playerAction(game, playerId, action, amount = 0) {
  if (game.phase !== 'playing') return game
  const actingIndex = game.players.findIndex((player) => player.id === playerId)
  if (actingIndex !== game.turnIndex) return game

  let potChange = 0
  let currentBet = game.currentBet
  let minRaise = game.minRaise
  const players = game.players.map((item) => ({ ...item }))
  const actor = players[actingIndex]
  let logMessage = ''

  if (action === 'fold') {
    actor.folded = true
    actor.acted = true
    logMessage = `${actor.name} folds.`
  }

  if (action === 'call') {
    const callAmount = Math.min(game.currentBet - actor.currentBet, actor.stack)
    actor.stack -= callAmount
    actor.currentBet += callAmount
    actor.committed += callAmount
    actor.acted = true
    potChange = callAmount
    logMessage = callAmount === 0 ? `${actor.name} checks.` : `${actor.name} calls ${callAmount}.`
  }

  if (action === 'raise') {
    const targetBet = game.currentBet + Math.max(amount, game.minRaise)
    const availableBet = actor.currentBet + actor.stack
    const actualTargetBet = Math.min(targetBet, availableBet)
    const contribution = Math.max(0, actualTargetBet - actor.currentBet)

    if (contribution === 0) return game

    const raiseSize = actualTargetBet - game.currentBet
    const isFullRaise = raiseSize >= game.minRaise

    actor.stack -= contribution
    actor.currentBet += contribution
    actor.committed += contribution
    actor.acted = true
    potChange = contribution
    currentBet = Math.max(currentBet, actor.currentBet)

    if (isFullRaise) {
      minRaise = raiseSize
      players.forEach((item, index) => {
        if (index !== actingIndex && !item.folded && item.stack > 0) item.acted = false
      })
    }

    logMessage = isFullRaise ? `${actor.name} raises to ${currentBet}.` : `${actor.name} is all in for ${currentBet}.`
  }

  const nextGame = {
    ...game,
    players,
    pot: game.pot + potChange,
    currentBet,
    minRaise,
    log: [logMessage, ...game.log],
  }

  return moveTurnOrAdvance(nextGame, actingIndex)
}
