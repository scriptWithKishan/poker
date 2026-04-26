import React, { useState } from 'react';
import { PokerTable } from './PokerTable';
import { Card } from './Card';
import { SuitIcon } from './CardSuit';

interface GameRoomProps {
  groupId: string;
  playerId: string;
  playerName: string;
  groupData: any;
  gameState: any;
  onStartGame: () => void;
  onPlayerAction: (action: string, amount?: number) => void;
  onLeave: () => void;
}

export function GameRoom({
  groupId,
  playerId,
  playerName,
  groupData,
  gameState,
  onStartGame,
  onPlayerAction,
  onLeave,
}: GameRoomProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(20);
  const [showRaiseInput, setShowRaiseInput] = useState(false);

  const isHost = groupData?.createdBy === playerId;
  const currentPlayer = gameState?.players?.find((p: any) => p.id === playerId);
  const isMyTurn = gameState?.players[gameState?.activePlayerIndex]?.id === playerId;
  const gameInProgress = gameState?.phase !== 'waiting';

  const handleRaise = () => {
    if (showRaiseInput) {
      onPlayerAction('raise', raiseAmount);
      setShowRaiseInput(false);
    } else {
      const minRaise = (gameState?.currentBet || 0) + (gameState?.bigBlind || 20);
      setRaiseAmount(minRaise);
      setShowRaiseInput(true);
    }
  };

  const getPhaseName = (phase: string) => {
    const names: Record<string, string> = {
      waiting: 'Waiting for players...',
      preflop: 'Pre-Flop',
      flop: 'Flop',
      turn: 'Turn',
      river: 'River',
      showdown: 'Showdown',
    };
    return names[phase] || phase;
  };

  return (
    <div className="game-room">
      {/* Header */}
      <header className="room-header">
        <div className="room-info">
          <button className="btn-icon" onClick={() => setShowLeaveConfirm(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="room-title-group">
            <h1 className="display room-title">{groupData?.name || 'Poker Table'}</h1>
            <div className="room-id">
              Group ID: <span>{groupId}</span>
              <button
                className="btn-copy"
                onClick={() => navigator.clipboard.writeText(groupId)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="room-status">
          <div className="player-count">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {groupData?.players?.length || 1} / 8
          </div>
          <div className={`game-phase ${gameInProgress ? 'active' : ''}`}>
            {getPhaseName(gameState?.phase)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="room-content">
        {/* Sidebar - Player List */}
        <aside className="players-sidebar">
          <h3 className="sidebar-title">Players</h3>
          <ul className="player-list">
            {groupData?.players?.map((player: any, index: number) => {
              const gamePlayer = gameState?.players?.find((p: any) => p.id === player.id);
              const isActive = gameState?.players[gameState?.activePlayerIndex]?.id === player.id;

              return (
                <li
                  key={player.id}
                  className={`player-item ${player.id === playerId ? 'is-me' : ''} ${isActive ? 'is-active' : ''}`}
                >
                  <div className="player-avatar">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="player-details">
                    <div className="player-name">
                      {player.name}
                      {player.id === groupData.createdBy && (
                        <span className="host-badge">Host</span>
                      )}
                      {player.id === playerId && (
                        <span className="you-badge">You</span>
                      )}
                    </div>
                    {gameInProgress && gamePlayer && (
                      <div className="player-chips">
                        <span className="chip-icon"></span>
                        {gamePlayer.chips?.toLocaleString() || 0}
                        {gamePlayer.folded && <span className="status-badge folded">Folded</span>}
                        {gamePlayer.allIn && <span className="status-badge allin">All-in</span>}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {!gameInProgress && isHost && groupData?.players?.length >= 2 && (
            <button className="btn btn-primary btn-full" onClick={onStartGame}>
              Start Game
            </button>
          )}

          {!gameInProgress && !isHost && (
            <div className="waiting-message">
              Waiting for host to start...
            </div>
          )}
        </aside>

        {/* Poker Table */}
        <div className="table-container">
          <PokerTable
            gameState={gameState}
            playerId={playerId}
            players={groupData?.players || []}
          />

          {/* Action Bar */}
          {gameInProgress && isMyTurn && currentPlayer && !currentPlayer.folded && (
            <div className="action-bar">
              <button
                className="btn-action fold"
                onClick={() => onPlayerAction('fold')}
              >
                Fold
              </button>

              {currentPlayer.bet >= (gameState?.currentBet || 0) ? (
                <button
                  className="btn-action check"
                  onClick={() => onPlayerAction('check')}
                >
                  Check
                </button>
              ) : (
                <button
                  className="btn-action call"
                  onClick={() => onPlayerAction('call')}
                >
                  Call {gameState?.currentBet - currentPlayer.bet}
                </button>
              )}

              <div className="raise-action">
                {showRaiseInput && (
                  <div className="raise-input-container">
                    <input
                      type="number"
                      value={raiseAmount}
                      onChange={(e) => setRaiseAmount(Number(e.target.value))}
                      min={gameState?.currentBet + (gameState?.bigBlind || 20)}
                      max={currentPlayer.chips + currentPlayer.bet}
                      autoFocus
                    />
                    <button
                      className="btn-action raise"
                      onClick={handleRaise}
                    >
                      Raise
                    </button>
                  </div>
                )}
                {!showRaiseInput && (
                  <button
                    className="btn-action raise"
                    onClick={handleRaise}
                  >
                    Raise
                  </button>
                )}
              </div>
            </div>
          )}

          {gameInProgress && !isMyTurn && (
            <div className="action-bar disabled">
              <span className="waiting-text">Waiting for {gameState?.players[gameState?.activePlayerIndex]?.name}...</span>
            </div>
          )}
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="modal-overlay" onClick={() => setShowLeaveConfirm(false)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <h2 className="display modal-title">Leave Group?</h2>
            <p className="modal-text">Are you sure you want to leave this table?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLeaveConfirm(false)}>
                Stay
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  onLeave();
                  setShowLeaveConfirm(false);
                }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
