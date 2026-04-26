import { createRoom } from './game'

const STORAGE_PREFIX = 'simple-poker-room'

export function getRoomKey(roomId) {
  return `${STORAGE_PREFIX}:${roomId}`
}

export function loadRoom(roomId) {
  try {
    const saved = localStorage.getItem(getRoomKey(roomId))
    return saved ? JSON.parse(saved) : createRoom(roomId)
  } catch {
    return createRoom(roomId)
  }
}

export function saveRoom(game) {
  localStorage.setItem(getRoomKey(game.roomId), JSON.stringify(game))
}
