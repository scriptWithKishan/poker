// Group management

export interface Player {
  id: string;
  name: string;
  joinedAt: number;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  players: Player[];
  createdAt: number;
}

const groups = new Map<string, Group>();

export function generateId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createGroup(
  id: string,
  name: string,
  creatorId: string,
  creatorName: string
): Group {
  const group: Group = {
    id,
    name: name || `Table ${id}`,
    createdBy: creatorId,
    players: [{ id: creatorId, name: creatorName, joinedAt: Date.now() }],
    createdAt: Date.now(),
  };
  groups.set(id, group);
  return group;
}

export function joinGroup(
  groupId: string,
  playerId: string,
  playerName: string
): boolean {
  const group = groups.get(groupId);
  if (!group) return false;
  if (group.players.length >= 8) return false;
  if (group.players.some((p) => p.id === playerId)) return false;

  group.players.push({ id: playerId, name: playerName, joinedAt: Date.now() });
  return true;
}

export function getGroup(groupId: string): Group | undefined {
  return groups.get(groupId);
}

export function leaveGroup(groupId: string, playerId: string): void {
  const group = groups.get(groupId);
  if (!group) return;

  group.players = group.players.filter((p) => p.id !== playerId);

  if (group.players.length === 0) {
    groups.delete(groupId);
  }
}

export function getPublicGroups(): Group[] {
  return Array.from(groups.values()).slice(0, 10);
}
