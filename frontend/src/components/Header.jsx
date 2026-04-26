/*
  Header owns the room identity controls shown above the poker table.
  The room id is intentionally visible and copyable because this frontend-only
  version stores games by room id and can later use the same value for a server.
*/
export default function Header({ roomId, roomInput, user, onRoomInputChange, onCreateRoom, onJoinRoom, onLogout }) {
  const roomUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`

  async function copyRoom() {
    await navigator.clipboard?.writeText(roomUrl)
  }

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Simple Texas Hold&apos;em</p>
        <h1>Poker Room</h1>
        <p className="signed-in">Signed in as {user.username}</p>
      </div>

      <div className="room-tools" aria-label="Room controls">
        <label>
          Room ID
          <input value={roomInput} onChange={(event) => onRoomInputChange(event.target.value.toUpperCase())} />
        </label>
        <button type="button" onClick={onJoinRoom}>
          Join
        </button>
        <button type="button" onClick={onCreateRoom}>
          New
        </button>
        <button type="button" onClick={copyRoom}>
          Copy Link
        </button>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
