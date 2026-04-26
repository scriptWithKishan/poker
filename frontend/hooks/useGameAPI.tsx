import { useState, useEffect, useCallback, useRef } from 'react';

// Determine if we're running on Vercel
const isVercel = () => {
  return typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    import.meta.env?.VERCEL
  );
};

interface GameState {
  groupId: string;
  playerId: string;
  playerName: string;
  groupData: any;
  gameState: any;
  isConnected: boolean;
  error: string | null;
}

export function useGameAPI() {
  const [state, setState] = useState<GameState>({
    groupId: '',
    playerId: '',
    playerName: '',
    groupData: null,
    gameState: null,
    isConnected: false,
    error: null,
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPollRef = useRef(0);

  // API base URL
  const apiUrl = isVercel() ? '/api' : '';

  // Create group (HTTP for Vercel)
  const createGroup = useCallback(async (name: string, playerName: string) => {
    try {
      if (isVercel()) {
        const res = await fetch(`${apiUrl}/groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, playerName }),
        });

        if (!res.ok) throw new Error('Failed to create group');

        const data = await res.json();
        setState({
          groupId: data.groupId,
          playerId: data.playerId,
          playerName,
          groupData: data.group,
          gameState: data.gameState,
          isConnected: true,
          error: null,
        });

        // Start polling for updates
        startPolling(data.groupId);
        return data;
      }
    } catch (err) {
      setState(s => ({ ...s, error: err instanceof Error ? err.message : 'Unknown error' }));
      throw err;
    }
  }, [apiUrl]);

  // Join group
  const joinGroup = useCallback(async (groupId: string, playerName: string) => {
    try {
      if (isVercel()) {
        const res = await fetch(`${apiUrl}/groups/${groupId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName }),
        });

        if (!res.ok) throw new Error('Failed to join group');

        const data = await res.json();
        setState(prev => ({
          ...prev,
          groupId: data.groupId,
          playerId: data.playerId,
          playerName,
          groupData: data.group,
          gameState: data.gameState,
          isConnected: true,
          error: null,
        }));

        startPolling(data.groupId);
        return data;
      }
    } catch (err) {
      setState(s => ({ ...s, error: err instanceof Error ? err.message : 'Unknown error' }));
      throw err;
    }
  }, [apiUrl]);

  // Start game
  const startGame = useCallback(async () => {
    if (!state.groupId || !state.playerId) return;

    try {
      if (isVercel()) {
        const res = await fetch(`${apiUrl}/groups/${state.groupId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: state.playerId }),
        });

        if (!res.ok) throw new Error('Failed to start game');

        const data = await res.json();
        setState(prev => ({
          ...prev,
          gameState: data.gameState,
        }));
      }
    } catch (err) {
      console.error('Start game error:', err);
    }
  }, [state.groupId, state.playerId, apiUrl]);

  // Player action
  const playerAction = useCallback(async (action: string, amount?: number) => {
    if (!state.groupId || !state.playerId) return;

    try {
      if (isVercel()) {
        const res = await fetch(`${apiUrl}/groups/${state.groupId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: state.playerId, action, amount }),
        });

        if (!res.ok) throw new Error('Action failed');

        const data = await res.json();
        setState(prev => ({
          ...prev,
          gameState: data.gameState,
        }));
      }
    } catch (err) {
      console.error('Action error:', err);
    }
  }, [state.groupId, state.playerId, apiUrl]);

  // Leave group
  const leaveGroup = useCallback(async () => {
    if (!state.groupId || !state.playerId) return;

    if (isVercel()) {
      await fetch(`${apiUrl}/groups/${state.groupId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: state.playerId }),
      });
    }

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    setState({
      groupId: '',
      playerId: '',
      playerName: '',
      groupData: null,
      gameState: null,
      isConnected: false,
      error: null,
    });
  }, [state.groupId, state.playerId, apiUrl]);

  // Polling for game state updates
  const startPolling = useCallback((groupId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Poll every 500ms for smooth gameplay
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/groups/${groupId}/poll`);
        if (res.ok) {
          const data = await res.json();
          setState(prev => ({
            ...prev,
            groupData: data.group,
            gameState: data.gameState,
          }));
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 500);
  }, [apiUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    ...state,
    createGroup,
    joinGroup,
    startGame,
    playerAction,
    leaveGroup,
    isVercel: isVercel(),
  };
}
