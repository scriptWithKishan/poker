import { BIG_BLIND } from '../utils/game'

/*
  ActionPanel contains the only controls that mutate an active hand.
  The parent passes the action handler, while this component calculates readable
  labels like check/call and a simple fixed raise amount for a low-complexity UI.
*/
export default function ActionPanel({ game, currentUser, onAction, onNextHand }) {
  const player = game.players[game.turnIndex]

  if (game.phase === 'complete') {
    return (
      <section className="panel actions">
        <h2>Hand Complete</h2>
        <button className="primary-action" type="button" onClick={onNextHand}>
          Deal Next Hand
        </button>
      </section>
    )
  }

  if (!player) {
    return (
      <section className="panel actions">
        <h2>Actions</h2>
        <p className="muted">Start a hand to enable player actions.</p>
      </section>
    )
  }

  const callAmount = Math.max(game.currentBet - player.currentBet, 0)
  const isCurrentUsersTurn = player.userId === currentUser.id
  const canRaise = isCurrentUsersTurn && player.stack > callAmount

  return (
    <section className="panel actions">
      <h2>{player.name}&apos;s Turn</h2>
      <p>{isCurrentUsersTurn ? `Needed to call: ${callAmount}` : 'Waiting for this player to act.'}</p>
      <div className="action-buttons">
        <button type="button" disabled={!isCurrentUsersTurn} onClick={() => onAction(player.id, 'fold')}>
          Fold
        </button>
        <button type="button" disabled={!isCurrentUsersTurn} onClick={() => onAction(player.id, 'call')}>
          {callAmount === 0 ? 'Check' : 'Call'}
        </button>
        <button type="button" disabled={!canRaise} onClick={() => onAction(player.id, 'raise', BIG_BLIND)}>
          Raise {BIG_BLIND}
        </button>
      </div>
    </section>
  )
}
