const roomClients = new Map()

function sendEvent(response, event, data) {
  response.write(`event: ${event}\n`)
  response.write(`data: ${JSON.stringify(data)}\n\n`)
}

/*
  Server-Sent Events are enough for this app because clients only need to hear
  when the room state changes. Player actions still use normal HTTP requests.
*/
export function addRoomClient(roomId, response) {
  if (!roomClients.has(roomId)) {
    roomClients.set(roomId, new Set())
  }

  roomClients.get(roomId).add(response)
  response.on('close', () => {
    roomClients.get(roomId)?.delete(response)
  })
}

export function broadcastRoom(room) {
  const clients = roomClients.get(room.roomId)
  if (!clients) return

  clients.forEach((response) => {
    sendEvent(response, 'room', room)
  })
}

export function sendRoom(response, room) {
  sendEvent(response, 'room', room)
}
