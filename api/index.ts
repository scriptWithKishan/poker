import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateId, createGroup, joinGroup, getGroup, leaveGroup } from '../backend/groups';
import { createGame, getGame, handlePlayerAction, startGame, removePlayer } from '../backend/game';

// In-memory storage for serverless (note: this won't persist across invocations in production)
// For production, use Redis or a database
const games = new Map();
const groups = new Map();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  const { path } = req.query;
  const route = Array.isArray(path) ? path.join('/') : path || '';

  try {
    // Health check
    if (route === '' || route === 'health') {
      return res.json({ status: 'ok', message: 'Poker API is running' });
    }

    // Create group
    if (route === 'groups' && req.method === 'POST') {
      const { name, playerName } = req.body;
      const groupId = generateId();
      const playerId = generateId();

      const group = createGroup(groupId, name, playerId, playerName);
      const game = createGame(groupId);
      game.addPlayer(playerId, playerName);

      // Store in memory (will be lost on cold starts in production)
      games.set(groupId, game);
      groups.set(groupId, group);

      return res.json({
        groupId,
        playerId,
        group,
        gameState: game.getPublicState(),
      });
    }

    // Join group
    if (route.match(/groups\/[A-Z0-9]+\/join/) && req.method === 'POST') {
      const groupId = route.split('/')[1];
      const { playerName } = req.body;

      // Try to get from memory first
      let group = groups.get(groupId) || getGroup(groupId);

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const playerId = generateId();
      const success = joinGroup(groupId, playerId, playerName);

      if (!success) {
        return res.status(400).json({ error: 'Could not join group' });
      }

      const game = games.get(groupId) || getGame(groupId);
      if (game) {
        game.addPlayer(playerId, playerName);
      }

      return res.json({
        groupId,
        playerId,
        group,
        gameState: game?.getPublicState(),
      });
    }

    // Get group
    if (route.match(/groups\/[A-Z0-9]+/) && req.method === 'GET') {
      const groupId = route.split('/')[1];
      const group = groups.get(groupId) || getGroup(groupId);

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const game = games.get(groupId) || getGame(groupId);

      return res.json({
        group,
        gameState: game?.getPublicState(),
      });
    }

    // Start game
    if (route.match(/groups\/[A-Z0-9]+\/start/) && req.method === 'POST') {
      const groupId = route.split('/')[1];
      const { playerId } = req.body;

      const group = groups.get(groupId) || getGroup(groupId);
      if (!group || group.createdBy !== playerId) {
        return res.status(403).json({ error: 'Only host can start game' });
      }

      const game = games.get(groupId) || getGame(groupId);
      if (game) {
        startGame(groupId);
      }

      return res.json({
        gameState: game?.getPublicState(),
      });
    }

    // Player action
    if (route.match(/groups\/[A-Z0-9]+\/action/) && req.method === 'POST') {
      const groupId = route.split('/')[1];
      const { playerId, action, amount } = req.body;

      const game = games.get(groupId) || getGame(groupId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const result = handlePlayerAction(groupId, playerId, action, amount);

      if (result.success) {
        return res.json({
          gameState: game.getPublicState(),
          handComplete: result.handComplete,
          winners: result.winners,
        });
      } else {
        return res.status(400).json({ error: result.error });
      }
    }

    // Poll for updates (replaces WebSocket for Vercel)
    if (route.match(/groups\/[A-Z0-9]+\/poll/) && req.method === 'GET') {
      const groupId = route.split('/')[1];

      const group = groups.get(groupId) || getGroup(groupId);
      const game = games.get(groupId) || getGame(groupId);

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      return res.json({
        group,
        gameState: game?.getPublicState(),
        timestamp: Date.now(),
      });
    }

    // Leave group
    if (route.match(/groups\/[A-Z0-9]+\/leave/) && req.method === 'POST') {
      const groupId = route.split('/')[1];
      const { playerId } = req.body;

      leaveGroup(groupId, playerId);
      const game = games.get(groupId) || getGame(groupId);
      if (game) {
        removePlayer(groupId, playerId);
      }

      return res.json({ success: true });
    }

    // 404 for unmatched routes
    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
