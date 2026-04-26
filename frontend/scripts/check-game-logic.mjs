import assert from 'node:assert/strict'
import { addPlayer, createRoom, playerAction, startHand } from '../src/utils/game.js'

function makeRoom(names) {
  return names.reduce((room, name, index) => addPlayer(room, name, `user-${index}`), createRoom('TESTROOM'))
}

function playerNames(game) {
  return game.players.map((player) => player.name)
}

function assertTurn(game, expectedName, message) {
  assert.equal(game.players[game.turnIndex]?.name, expectedName, message)
}

let headsUp = startHand(makeRoom(['Alice', 'Bob']))
assert.equal(headsUp.players[headsUp.dealerIndex].name, 'Alice', 'heads-up first hand dealer should be first player')
assert.equal(headsUp.players[0].currentBet, 10, 'heads-up dealer should post the small blind')
assert.equal(headsUp.players[1].currentBet, 20, 'heads-up other player should post the big blind')
assertTurn(headsUp, 'Alice', 'heads-up small blind/dealer acts first preflop')

headsUp = playerAction(headsUp, headsUp.players[0].id, 'call')
assertTurn(headsUp, 'Bob', 'heads-up big blind should get the option after small blind calls')
headsUp = playerAction(headsUp, headsUp.players[1].id, 'call')
assert.equal(headsUp.street, 'flop', 'heads-up should advance to flop after big blind checks')
assert.equal(headsUp.community.length, 3, 'flop should deal exactly three cards')
assertTurn(headsUp, 'Bob', 'heads-up big blind acts first after the flop')

let threePlayer = startHand(makeRoom(['Alice', 'Bob', 'Cara']))
assert.equal(threePlayer.players[threePlayer.dealerIndex].name, 'Alice', 'three-player first dealer should be first player')
assert.equal(threePlayer.players[1].currentBet, 10, 'left of dealer should post small blind with 3+ players')
assert.equal(threePlayer.players[2].currentBet, 20, 'left of small blind should post big blind with 3+ players')
assertTurn(threePlayer, 'Alice', 'left of big blind should act first preflop with 3 players')

threePlayer = playerAction(threePlayer, threePlayer.players[0].id, 'call')
assertTurn(threePlayer, 'Bob', 'small blind should act after under-the-gun calls')
threePlayer = playerAction(threePlayer, threePlayer.players[1].id, 'call')
assertTurn(threePlayer, 'Cara', 'big blind should still get an option after calls')
threePlayer = playerAction(threePlayer, threePlayer.players[2].id, 'call')
assert.equal(threePlayer.street, 'flop', 'three-player hand should advance after big blind checks')
assertTurn(threePlayer, 'Bob', 'first active player left of dealer acts first after flop')

const foldedPreviousHand = {
  ...threePlayer,
  phase: 'complete',
  players: threePlayer.players.map((player, index) => ({ ...player, folded: index === 1 })),
}
const nextHand = startHand(foldedPreviousHand)
assert.equal(nextHand.players[nextHand.dealerIndex].name, 'Bob', 'dealer should rotate to next seated player, even if they folded last hand')

let allInRoom = makeRoom(['Short', 'Deep'])
allInRoom = {
  ...allInRoom,
  players: allInRoom.players.map((player, index) => ({ ...player, stack: index === 0 ? 10 : 100 })),
}
let allInHand = startHand(allInRoom)
assertTurn(allInHand, 'Deep', 'only deep stack can act after short stack posts all-in small blind')
allInHand = playerAction(allInHand, allInHand.players[1].id, 'call')
assert.equal(allInHand.phase, 'complete', 'hand should run out automatically when only one player can act')
assert.equal(allInHand.community.length, 5, 'all-in hand should deal the full board')
assert.equal(
  allInHand.players.reduce((total, player) => total + player.stack, 0),
  110,
  'chip total should stay constant after all-in showdown',
)

console.log(`Poker game logic checks passed for: ${playerNames(nextHand).join(', ')}`)
