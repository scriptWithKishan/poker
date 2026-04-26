import Card from './Card'

/*
  PlayerSeat renders each participant around the table.
  It shows betting state, stack, dealer marker, fold state, and cards. Only the
  logged-in player sees only their own cards, so this component stays
  display-only and reusable while preserving hidden opponent cards.
*/
export default function PlayerSeat({ player, isTurn, showCards, handName }) {
  return (
    <article className={`seat ${isTurn ? 'seat--active' : ''} ${player.folded ? 'seat--folded' : ''}`}>
      <div className="seat-header">
        <strong>{player.name}</strong>
        {player.dealer && <span className="dealer-chip">D</span>}
      </div>

      <div className="seat-cards">
        {player.hand.length > 0 ? (
          player.hand.map((card) => <Card key={card.id} card={card} hidden={!showCards} small />)
        ) : (
          <>
            <Card hidden small />
            <Card hidden small />
          </>
        )}
      </div>

      <dl className="seat-stats">
        <div>
          <dt>Stack</dt>
          <dd>{player.stack}</dd>
        </div>
        <div>
          <dt>Bet</dt>
          <dd>{player.currentBet}</dd>
        </div>
      </dl>

      {player.folded && <p className="seat-note">Folded</p>}
      {handName && <p className="seat-note">{handName}</p>}
    </article>
  )
}
