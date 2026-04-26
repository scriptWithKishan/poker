import React from 'react';
import { Card } from './Card';
import { SuitIcon } from './CardSuit';

interface PokerTableProps {
  gameState: any;
  playerId: string;
  players: any[];
}

export function PokerTable({ gameState, playerId, players }: PokerTableProps) {
  const phase = gameState?.phase || 'waiting';
  const pot = gameState?.pot || 0;
  const currentBet = gameState?.currentBet || 0;
  const communityCards = gameState?.communityCards || [];

  // Calculate player positions around the table
  const getPlayerPosition = (index: number, total: number) => {
    const angle = (index / total) * 360 - 90; // Start from top
    const radius = 42; // percentage
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    return { x, y, angle };
  };

  const currentPlayer = gameState?.players?.find((p: any) => p.id === playerId);
  const isActivePlayer = (p: any) =>
    gameState?.players[gameState?.activePlayerIndex]?.id === p.id;

  return (
    <div className="poker-table-wrapper">
      {/* Table Surface */}
      <div className="poker-table">
        {/* Table Felt */}
        <div className="table-felt">
          {/* Table Border Glow */}
          <div className="table-glow"></div>

          {/* Community Cards */}
          <div className="community-cards">
            {phase === 'waiting' ? (
              <div className="waiting-placeholder">
                <span className="display">POKER</span>
              </div>
            ) : (
              <>
                <div className="cards-row">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`community-card-slot ${
                        communityCards[i] ? 'has-card' : ''
                      } ${i < communityCards.length ? 'revealed' : ''}`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {communityCards[i] ? (
                        <Card
                          suit={communityCards[i].suit}
                          rank={communityCards[i].rank}
                          size="medium"
                        />
                      ) : (
                        <div className="card-placeholder"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pot */}
                {pot > 0 && (
                  <div className="pot-display">
                    <div className="pot-amount">
                      <span className="pot-label">Pot</span>
                      <span className="pot-value">{pot.toLocaleString()}</span>
                    </div>
                    {currentBet > 0 && (
                      <div className="bet-to-call">
                        To call: {currentBet}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Players around the table */}
          {gameState?.players?.map((player: any, index: number) => {
            const pos = getPlayerPosition(index, gameState.players.length);
            const isMe = player.id === playerId;
            const isActive = isActivePlayer(player);

            return (
              <div
                key={player.id}
                className={`table-player ${isMe ? 'is-me' : ''} ${isActive ? 'is-active' : ''} ${player.folded ? 'folded' : ''}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="player-spot">
                  {/* Cards */}
                  <div className="player-cards">
                    {isMe && player.cards?.length > 0 ? (
                      <>
                        <Card
                          suit={player.cards[0]?.suit}
                          rank={player.cards[0]?.rank}
                          size="small"
                          hidden={player.cards[0]?.hidden}
                        />
                        <Card
                          suit={player.cards[1]?.suit}
                          rank={player.cards[1]?.rank}
                          size="small"
                          hidden={player.cards[1]?.hidden}
                        />
                      </>
                    ) : (
                      <>
                        <div className={`card-back ${player.cards.length > 0 ? 'visible' : ''}`}></div>
                        <div className={`card-back ${player.cards.length > 0 ? 'visible' : ''}`}></div>
                      </>
                    )}
                  </div>

                  {/* Bet */}
                  {player.bet > 0 && (
                    <div className="player-bet">
                      {player.bet}
                    </div>
                  )}

                  {/* Avatar & Info */}
                  <div className="player-spot-info">
                    <div className="spot-avatar">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="spot-details">
                      <span className="spot-name">
                        {player.name}
                        {isMe && <span className="me-tag">(You)</span>}
                      </span>
                      <span className="spot-chips">{player.chips?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Turn Indicator */}
                  {isActive && (
                    <div className="turn-indicator">
                      <div className="turn-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Hand (if in game) */}
      {currentPlayer?.cards?.length > 0 && currentPlayer.cards[0]?.hidden === undefined && (
        <div className="my-hand">
          <div className="my-hand-label">Your Hand</div>
          <div className="my-cards">
            <Card
              suit={currentPlayer.cards[0]?.suit}
              rank={currentPlayer.cards[0]?.rank}
              size="large"
            />
            <Card
              suit={currentPlayer.cards[1]?.suit}
              rank={currentPlayer.cards[1]?.rank}
              size="large"
            />
          </div>
        </div>
      )}
    </div>
  );
}
