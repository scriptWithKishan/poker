import Card from './Card'
import PlayerSeat from './PlayerSeat'

/*
  Table is the main play surface.
  It arranges seats in a responsive grid with equal spacing, keeps community
  cards centered, and exposes current pot/street information without owning any
  poker rules.
*/
export default function Table({ game, currentUser }) {
  return (
    <section className="table-shell">
      <div className="seat-grid">
        {game.players.map((player, index) => (
          <PlayerSeat
            key={player.id}
            player={player}
            isTurn={index === game.turnIndex}
            showCards={player.userId === currentUser.id}
            handName={game.revealedHands[player.id]}
          />
        ))}
      </div>

      <div className="table-center">
        <div className="table-meta">
          <span>Pot: {game.pot}</span>
          <span>Street: {game.street}</span>
          <span>Current bet: {game.currentBet}</span>
        </div>

        <div className="community-cards" aria-label="Community cards">
          {[0, 1, 2, 3, 4].map((slot) => (
            <Card key={slot} card={game.community[slot]} />
          ))}
        </div>

        {game.winnerText && <p className="winner-banner">{game.winnerText}</p>}
      </div>
    </section>
  )
}
