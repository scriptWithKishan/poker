/*
  Lobby handles only pre-game table setup.
  A logged-in user joins with their account username, capped at eight seats.
  Keeping this component separate makes later invite/permission changes easier
  without changing the poker table.
*/
export default function Lobby({ players, currentUser, onAddPlayer, onRemovePlayer, onStartHand }) {
  const hasJoined = players.some((player) => player.userId === currentUser.id)

  return (
    <section className="panel lobby">
      <div>
        <h2>Players</h2>
        <p>Join this room as your username. Start the hand when at least two players have joined.</p>
      </div>

      <button type="button" onClick={onAddPlayer} disabled={hasJoined || players.length >= 8}>
        {hasJoined ? `Joined as ${currentUser.username}` : `Join as ${currentUser.username}`}
      </button>

      <div className="lobby-list">
        {players.length === 0 && <p className="muted">No players yet.</p>}
        {players.map((player) => (
          <div className="lobby-player" key={player.id}>
            <span>{player.name}</span>
            <button type="button" onClick={() => onRemovePlayer(player.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <button className="primary-action" type="button" onClick={onStartHand} disabled={players.length < 2}>
        Start Hand
      </button>
    </section>
  )
}
