import index from "./index.html";
import { generateId, createGroup, joinGroup, getGroup, leaveGroup, getPublicGroups } from "./backend/groups";
import { createGame, getGame, handlePlayerAction, startGame, removePlayer } from "./backend/game";
import type { ServerWebSocket } from "bun";

// Types
interface WSData {
  groupId?: string;
  playerId?: string;
  playerName?: string;
}

// Active connections by group
const connections = new Map<string, Set<ServerWebSocket<WSData>>>();

// Broadcast to all connections in a group
function broadcastToGroup(groupId: string, message: any, exclude?: ServerWebSocket<WSData>) {
  const groupConnections = connections.get(groupId);
  if (!groupConnections) return;

  const data = JSON.stringify(message);
  for (const ws of groupConnections) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

// Send to specific connection
function send(ws: ServerWebSocket<WSData>, message: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

Bun.serve({
  port: 3000,
  routes: {
    "/": index,
    "/api/groups": {
      GET: () => {
        const groups = getPublicGroups();
        return new Response(JSON.stringify({ groups }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    "/api/groups/:id": {
      GET: (req) => {
        const groupId = req.params.id;
        const group = getGroup(groupId);
        if (!group) {
          return new Response(JSON.stringify({ error: "Group not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ group }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    "/api/groups/:id/game": {
      GET: (req) => {
        const groupId = req.params.id;
        const game = getGame(groupId);
        if (!game) {
          return new Response(JSON.stringify({ error: "Game not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ game: game.getPublicState() }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
  websocket: {
    open: (ws) => {
      console.log("WebSocket connected");
    },
    message: (ws, message) => {
      const text = message.toString();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        send(ws, { type: "error", message: "Invalid JSON" });
        return;
      }

      switch (data.type) {
        case "create_group": {
          const { name, playerName } = data;
          const groupId = generateId();
          const playerId = generateId();

          const group = createGroup(groupId, name, playerId, playerName);
          const game = createGame(groupId);
          game.addPlayer(playerId, playerName);

          ws.data.groupId = groupId;
          ws.data.playerId = playerId;
          ws.data.playerName = playerName;

          if (!connections.has(groupId)) {
            connections.set(groupId, new Set());
          }
          connections.get(groupId)!.add(ws);

          send(ws, {
            type: "group_created",
            groupId,
            playerId,
            group,
            gameState: game.getPublicState(),
          });
          break;
        }

        case "join_group": {
          const { groupId, playerName } = data;
          const group = getGroup(groupId);

          if (!group) {
            send(ws, { type: "error", message: "Group not found" });
            return;
          }

          const playerId = generateId();
          const success = joinGroup(groupId, playerId, playerName);

          if (!success) {
            send(ws, { type: "error", message: "Could not join group" });
            return;
          }

          const game = getGame(groupId);
          if (game) {
            game.addPlayer(playerId, playerName);
          }

          ws.data.groupId = groupId;
          ws.data.playerId = playerId;
          ws.data.playerName = playerName;

          if (!connections.has(groupId)) {
            connections.set(groupId, new Set());
          }
          connections.get(groupId)!.add(ws);

          send(ws, {
            type: "joined_group",
            groupId,
            playerId,
            group,
            gameState: game?.getPublicState(),
          });

          // Notify others
          broadcastToGroup(groupId, {
            type: "player_joined",
            playerId,
            playerName,
            playerCount: group.players.length,
          }, ws);
          break;
        }

        case "start_game": {
          const { groupId, playerId } = data;
          const group = getGroup(groupId);

          if (!group || group.createdBy !== playerId) {
            send(ws, { type: "error", message: "Only host can start game" });
            return;
          }

          const game = getGame(groupId);
          if (game) {
            startGame(groupId);
            broadcastToGroup(groupId, {
              type: "game_started",
              gameState: game.getPublicState(),
            });
          }
          break;
        }

        case "player_action": {
          const { groupId, playerId, action, amount } = data;
          const game = getGame(groupId);

          if (!game) {
            send(ws, { type: "error", message: "Game not found" });
            return;
          }

          const result = handlePlayerAction(groupId, playerId, action, amount);

          if (result.success) {
            broadcastToGroup(groupId, {
              type: "game_update",
              gameState: game.getPublicState(),
              action,
              playerId,
            });

            if (result.handComplete) {
              setTimeout(() => {
                broadcastToGroup(groupId, {
                  type: "hand_complete",
                  winners: result.winners,
                  gameState: game.getPublicState(),
                });
              }, 2000);
            }
          } else {
            send(ws, { type: "error", message: result.error });
          }
          break;
        }

        case "chat": {
          const { groupId, playerName, text } = data;
          broadcastToGroup(groupId, {
            type: "chat",
            playerName,
            text,
            timestamp: Date.now(),
          });
          break;
        }
      }
    },
    close: (ws) => {
      const { groupId, playerId } = ws.data;

      if (groupId) {
        connections.get(groupId)?.delete(ws);

        if (playerId) {
          leaveGroup(groupId, playerId);
          const game = getGame(groupId);
          if (game) {
            removePlayer(groupId, playerId);
          }

          broadcastToGroup(groupId, {
            type: "player_left",
            playerId,
          });
        }
      }
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("🃏 Poker server running at http://localhost:3000");
