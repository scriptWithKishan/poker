import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { LandingPage } from './components/LandingPage';
import { GameRoom } from './components/GameRoom';
import { WebSocketProvider, useWebSocket } from './hooks/useWebSocket';
import { useGameAPI } from './hooks/useGameAPI';
import './styles.css';

// Determine runtime environment
const isVercel = () => {
  return typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    (import.meta as any).env?.VERCEL
  );
};

// Vercel-compatible App (uses HTTP polling)
function VercelApp() {
  const {
    groupId,
    playerId,
    playerName,
    groupData,
    gameState,
    isConnected,
    error,
    createGroup,
    joinGroup,
    startGame,
    playerAction,
    leaveGroup,
  } = useGameAPI();

  const [currentView, setCurrentView] = useState<'landing' | 'room'>('landing');

  const handleCreateGroup = useCallback(async (name: string, pName: string) => {
    await createGroup(name, pName);
    setCurrentView('room');
  }, [createGroup]);

  const handleJoinGroup = useCallback(async (gId: string, pName: string) => {
    await joinGroup(gId, pName);
    setCurrentView('room');
  }, [joinGroup]);

  const handleLeave = useCallback(() => {
    leaveGroup();
    setCurrentView('landing');
  }, [leaveGroup]);

  return (
    <div className="app">
      {currentView === 'landing' && (
        <LandingPage
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          isConnected={true}
          error={error}
        />
      )}
      {currentView === 'room' && groupData && (
        <GameRoom
          groupId={groupId}
          playerId={playerId}
          playerName={playerName}
          groupData={groupData}
          gameState={gameState}
          onStartGame={startGame}
          onPlayerAction={playerAction}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}

// Local/Bun App (uses WebSocket)
function LocalAppContent() {
  const [currentView, setCurrentView] = useState<'landing' | 'room'>('landing');
  const [groupId, setGroupId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [groupData, setGroupData] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const { ws, isConnected, sendMessage } = useWebSocket();

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'group_created':
          setGroupId(data.groupId);
          setPlayerId(data.playerId);
          setGroupData(data.group);
          setGameState(data.gameState);
          setCurrentView('room');
          break;

        case 'joined_group':
          setGroupId(data.groupId);
          setPlayerId(data.playerId);
          setGroupData(data.group);
          setGameState(data.gameState);
          setCurrentView('room');
          break;

        case 'player_joined':
          if (groupData) {
            setGroupData((prev: any) => ({
              ...prev,
              players: [
                ...prev.players,
                { id: data.playerId, name: data.playerName, joinedAt: Date.now() },
              ],
            }));
          }
          break;

        case 'player_left':
          if (groupData) {
            setGroupData((prev: any) => ({
              ...prev,
              players: prev.players.filter((p: any) => p.id !== data.playerId),
            }));
          }
          break;

        case 'game_started':
        case 'game_update':
          setGameState(data.gameState);
          break;

        case 'hand_complete':
          setGameState(data.gameState);
          break;

        case 'error':
          console.error('WebSocket error:', data.message);
          break;
      }
    };
  }, [ws, groupData]);

  const handleCreateGroup = useCallback((name: string, pName: string) => {
    setPlayerName(pName);
    sendMessage({
      type: 'create_group',
      name,
      playerName: pName,
    });
  }, [sendMessage]);

  const handleJoinGroup = useCallback((gId: string, pName: string) => {
    setPlayerName(pName);
    sendMessage({
      type: 'join_group',
      groupId: gId,
      playerName: pName,
    });
  }, [sendMessage]);

  const handleStartGame = useCallback(() => {
    sendMessage({
      type: 'start_game',
      groupId,
      playerId,
    });
  }, [sendMessage, groupId, playerId]);

  const handlePlayerAction = useCallback((action: string, amount?: number) => {
    sendMessage({
      type: 'player_action',
      groupId,
      playerId,
      action,
      amount,
    });
  }, [sendMessage, groupId, playerId]);

  const handleLeaveGroup = useCallback(() => {
    setCurrentView('landing');
    setGroupId('');
    setPlayerId('');
    setGroupData(null);
    setGameState(null);
  }, []);

  return (
    <div className="app">
      {currentView === 'landing' && (
        <LandingPage
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          isConnected={isConnected}
        />
      )}
      {currentView === 'room' && groupData && (
        <GameRoom
          groupId={groupId}
          playerId={playerId}
          playerName={playerName}
          groupData={groupData}
          gameState={gameState}
          onStartGame={handleStartGame}
          onPlayerAction={handlePlayerAction}
          onLeave={handleLeaveGroup}
        />
      )}
    </div>
  );
}

function LocalApp() {
  return (
    <WebSocketProvider>
      <LocalAppContent />
    </WebSocketProvider>
  );
}

// Main App - chooses implementation based on environment
function App() {
  if (isVercel()) {
    return <VercelApp />;
  }
  return <LocalApp />;
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
