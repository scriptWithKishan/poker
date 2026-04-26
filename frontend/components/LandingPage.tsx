import React, { useState } from 'react';
import { CardSuit } from './CardSuit';
import { ChipStack } from './ChipStack';

interface LandingPageProps {
  onCreateGroup: (name: string, playerName: string) => void;
  onJoinGroup: (groupId: string, playerName: string) => void;
  isConnected: boolean;
  error?: string | null;
}

export function LandingPage({ onCreateGroup, onJoinGroup, isConnected, error }: LandingPageProps) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupId, setGroupId] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateGroup(groupName.trim() || 'My Poker Table', playerName.trim());
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && groupId.trim()) {
      onJoinGroup(groupId.trim().toUpperCase(), playerName.trim());
    }
  };

  return (
    <div className="landing-page">
      {/* Background Effects */}
      <div className="ambient-glow ambient-glow-1"></div>
      <div className="ambient-glow ambient-glow-2"></div>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-brand">
          <CardSuit className="nav-icon" />
          <span className="display nav-title">Poker</span>
        </div>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-visual">
            <ChipStack />
          </div>

          <h1 className="display hero-title">
            Poker,<br />
            <span className="hero-title-accent">Reimagined</span>
          </h1>

          <p className="hero-subtitle">
            A minimal, social poker experience designed for the modern player.
            No clutter, no casino noise — just the game you love.
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create Group
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowJoinModal(true)}
            >
              Join Group
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="display section-title">How It Works</h2>

        <div className="steps">
          <div className="step">
            <div className="step-number">01</div>
            <h3 className="step-title">Create or Join</h3>
            <p className="step-description">
              Start a new table or join an existing one with a simple Group ID.
            </p>
          </div>

          <div className="step">
            <div className="step-number">02</div>
            <h3 className="step-title">Invite Friends</h3>
            <p className="step-description">
              Up to 8 players. Share your Group ID and play together instantly.
            </p>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <h3 className="step-title">Play Poker</h3>
            <p className="step-description">
              Smooth, real-time gameplay with clean animations and zero friction.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>Built for poker enthusiasts 🃏</p>
      </footer>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            <h2 className="display modal-title">Create a Group</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Group Name (Optional)</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="My Poker Table"
                  maxLength={30}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                Create Group
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoinModal(false)}>&times;</button>
            <h2 className="display modal-title">Join a Group</h2>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>Group ID</label>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value.toUpperCase())}
                  placeholder="Enter Group ID"
                  maxLength={8}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                Join Group
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
