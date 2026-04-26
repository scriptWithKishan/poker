import { useEffect, useRef, useState } from 'react'
import ActionPanel from './components/ActionPanel'
import AuthPanel from './components/AuthPanel'
import GameLog from './components/GameLog'
import Header from './components/Header'
import Lobby from './components/Lobby'
import Table from './components/Table'
import {
  clearSession,
  getCurrentUser,
  getSavedSession,
  loadOrCreateRoom,
  login,
  saveRoomToApi,
  signup,
  subscribeToRoom,
} from './services/api'
import { addPlayer, createRoom, playerAction, removePlayer, startHand } from './utils/game'
import './App.css'

function getInitialRoomId() {
  const params = new URLSearchParams(window.location.search)
  return params.get('room')?.toUpperCase() || crypto.randomUUID().slice(0, 8).toUpperCase()
}

/*
  App coordinates the full poker application.
  It keeps state in one place, saves the room to localStorage, listens for room
  updates from other tabs on the same browser, and passes narrow callbacks down
  to focused components.
*/
function App() {
  const [initialRoomId] = useState(getInitialRoomId)
  const [game, setGame] = useState(() => createRoom(initialRoomId))
  const [roomInput, setRoomInput] = useState(initialRoomId)
  const [isReady, setIsReady] = useState(false)
  const [session, setSession] = useState(getSavedSession)
  const [statusText, setStatusText] = useState(session ? 'Verifying login...' : '')
  const lastSyncedRoom = useRef('')
  const sessionToken = session?.token || ''

  useEffect(() => {
    if (!sessionToken) return undefined

    let active = true

    getCurrentUser()
      .then((user) => {
        if (!active) return
        setSession((current) => (current ? { ...current, user } : current))
      })
      .catch(() => {
        if (!active) return
        clearSession()
        setSession(null)
        setStatusText('Your login expired. Please log in again.')
      })

    return () => {
      active = false
    }
  }, [sessionToken])

  useEffect(() => {
    if (!session) return undefined

    let active = true

    loadOrCreateRoom(initialRoomId)
      .then((room) => {
        if (!active) return
        lastSyncedRoom.current = JSON.stringify(room)
        setGame(room)
        setRoomInput(room.roomId)
        setStatusText('Connected. Room updates are synced through the backend.')
      })
      .catch((error) => {
        if (!active) return
        setStatusText(error.message)
      })
      .finally(() => {
        if (active) setIsReady(true)
      })

    return () => {
      active = false
    }
  }, [initialRoomId, session])

  useEffect(() => {
    window.history.replaceState(null, '', `?room=${game.roomId}`)
  }, [game])

  useEffect(() => {
    if (!isReady || !session) return undefined

    const timeout = window.setTimeout(() => {
      const serializedRoom = JSON.stringify(game)
      if (serializedRoom === lastSyncedRoom.current) return

      saveRoomToApi(game)
        .then((savedRoom) => {
          lastSyncedRoom.current = JSON.stringify(savedRoom)
        })
        .catch((error) => setStatusText(error.message))
    }, 120)

    return () => window.clearTimeout(timeout)
  }, [game, isReady, session])

  useEffect(() => {
    if (!isReady || !session) return undefined

    return subscribeToRoom(game.roomId, (room) => {
      const serializedRoom = JSON.stringify(room)
      if (serializedRoom === lastSyncedRoom.current) return

      lastSyncedRoom.current = serializedRoom
      setGame(room)
      setStatusText('Connected. Room updates are synced through the backend.')
    })
  }, [game.roomId, isReady, session])

  async function handleLogin(username, password) {
    setStatusText('Logging in...')

    try {
      const nextSession = await login(username, password)
      setSession(nextSession)
      setStatusText('Login successful.')
    } catch (error) {
      setStatusText(error.message)
    }
  }

  async function handleSignup(username, password) {
    setStatusText('Creating account...')

    try {
      const nextSession = await signup(username, password)
      setSession(nextSession)
      setStatusText('Account created.')
    } catch (error) {
      setStatusText(error.message)
    }
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    setIsReady(false)
    setStatusText('')
  }

  function joinCurrentUser(currentGame) {
    return addPlayer(currentGame, session.user.username, session.user.id)
  }

  async function createNewRoom() {
    const nextRoom = joinCurrentUser(createRoom())

    try {
      const savedRoom = await saveRoomToApi(nextRoom)
      lastSyncedRoom.current = JSON.stringify(savedRoom)
      setGame(savedRoom)
      setRoomInput(savedRoom.roomId)
    } catch (error) {
      setStatusText(error.message)
    }
  }

  async function joinRoom() {
    const roomId = roomInput.trim().toUpperCase()
    if (!roomId) return
    setStatusText('Loading room...')

    try {
      const room = await loadOrCreateRoom(roomId)
      const joinedRoom = joinCurrentUser(room)
      lastSyncedRoom.current = JSON.stringify(room)
      setGame(joinedRoom)
      setRoomInput(room.roomId)
      setStatusText('Connected. Room updates are synced through the backend.')
    } catch (error) {
      setStatusText(error.message)
    }
  }

  function handlePlayerAction(playerId, action, amount) {
    setGame((current) => {
      const activePlayer = current.players[current.turnIndex]

      if (!activePlayer || activePlayer.userId !== session.user.id || activePlayer.id !== playerId) {
        setStatusText('Wait for your turn.')
        return current
      }

      return playerAction(current, playerId, action, amount)
    })
  }

  if (!session) {
    return <AuthPanel onLogin={handleLogin} onSignup={handleSignup} statusText={statusText} />
  }

  return (
    <main className="app">
      <Header
        roomId={game.roomId}
        roomInput={roomInput}
        user={session.user}
        onRoomInputChange={setRoomInput}
        onCreateRoom={createNewRoom}
        onJoinRoom={joinRoom}
        onLogout={handleLogout}
      />

      <section className="notice">
        {statusText}
      </section>

      {game.phase === 'lobby' ? (
        <Lobby
          players={game.players}
          currentUser={session.user}
          onAddPlayer={() => setGame((current) => joinCurrentUser(current))}
          onRemovePlayer={(playerId) => setGame((current) => removePlayer(current, playerId))}
          onStartHand={() => setGame((current) => startHand(current))}
        />
      ) : (
        <>
          <Table game={game} currentUser={session.user} />
          <section className="side-by-side">
            <ActionPanel
              game={game}
              currentUser={session.user}
              onAction={handlePlayerAction}
              onNextHand={() => setGame((current) => startHand(current))}
            />
            <GameLog log={game.log} />
          </section>
        </>
      )}
    </main>
  )
}

export default App
