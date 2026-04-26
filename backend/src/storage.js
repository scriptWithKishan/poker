import { MongoClient } from 'mongodb'

const memoryRooms = new Map()
const memoryUsers = new Map()

function isPlaceholderMongoUrl(url) {
  return !url || url.includes('YOUR_USER') || url.includes('YOUR_PASSWORD') || url.includes('YOUR_CLUSTER')
}

/*
  Storage hides MongoDB from the HTTP server.
  If MONGODB_URL is not configured yet, it falls back to memory so local
  development still works while you are setting up your cloud database.
*/
export async function createStorage() {
  const mongoUrl = process.env.MONGODB_URL

  if (isPlaceholderMongoUrl(mongoUrl)) {
    return {
      mode: 'memory',
      async getRoom(roomId) {
        return memoryRooms.get(roomId) || null
      },
      async saveRoom(room) {
        memoryRooms.set(room.roomId, room)
        return room
      },
      async getUserById(userId) {
        return memoryUsers.get(userId) || null
      },
      async getUserByUsername(username) {
        return [...memoryUsers.values()].find((user) => user.username === username) || null
      },
      async createUser(user) {
        memoryUsers.set(user.id, user)
        return user
      },
    }
  }

  const client = new MongoClient(mongoUrl)
  await client.connect()
  const database = client.db(process.env.MONGODB_DB || 'poker')
  const rooms = database.collection('rooms')
  const users = database.collection('users')
  await rooms.createIndex({ roomId: 1 }, { unique: true })
  await users.createIndex({ username: 1 }, { unique: true })

  return {
    mode: 'mongodb',
    async getRoom(roomId) {
      const document = await rooms.findOne({ roomId }, { projection: { _id: 0 } })
      return document?.game || null
    },
    async saveRoom(room) {
      await rooms.updateOne(
        { roomId: room.roomId },
        { $set: { roomId: room.roomId, game: room, updatedAt: new Date() } },
        { upsert: true },
      )
      return room
    },
    async getUserById(userId) {
      return users.findOne({ id: userId }, { projection: { _id: 0 } })
    },
    async getUserByUsername(username) {
      return users.findOne({ username }, { projection: { _id: 0 } })
    },
    async createUser(user) {
      await users.insertOne({ ...user, createdAt: new Date() })
      return user
    },
  }
}
