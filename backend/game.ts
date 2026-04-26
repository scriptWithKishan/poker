// Poker game logic

type Card = { suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'; rank: string; value: number };
type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

interface PlayerState {
  id: string;
  name: string;
  chips: number;
  cards: Card[];
  bet: number;
  folded: boolean;
  allIn: boolean;
  position: number;
}

interface GameState {
  id: string;
  phase: GamePhase;
  players: PlayerState[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  dealerPosition: number;
  activePlayerIndex: number;
  smallBlind: number;
  bigBlind: number;
  winners?: string[];
}

const games = new Map<string, GameManager>();

const SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

class GameManager {
  state: GameState;
  private deck: Card[] = [];

  constructor(id: string) {
    this.state = {
      id,
      phase: 'waiting',
      players: [],
      communityCards: [],
      pot: 0,
      currentBet: 0,
      dealerPosition: -1,
      activePlayerIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
    };
  }

  addPlayer(id: string, name: string, startingChips = 1000): void {
    if (this.state.players.length >= 8) return;
    if (this.state.players.some((p) => p.id === id)) return;

    this.state.players.push({
      id,
      name,
      chips: startingChips,
      cards: [],
      bet: 0,
      folded: false,
      allIn: false,
      position: this.state.players.length,
    });
  }

  removePlayer(id: string): void {
    this.state.players = this.state.players.filter((p) => p.id !== id);
  }

  start(): boolean {
    if (this.state.players.length < 2) return false;
    if (this.state.phase !== 'waiting') return false;

    this.dealNewHand();
    return true;
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, value: RANK_VALUES[rank] });
      }
    }
    return this.shuffle(deck);
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private dealNewHand(): void {
    this.deck = this.createDeck();
    this.state.communityCards = [];
    this.state.pot = 0;
    this.state.currentBet = 0;
    this.state.winners = undefined;
    this.state.phase = 'preflop';

    // Move dealer button
    this.state.dealerPosition = (this.state.dealerPosition + 1) % this.state.players.length;

    // Reset players
    for (const player of this.state.players) {
      player.cards = [this.deck.pop()!, this.deck.pop()!];
      player.bet = 0;
      player.folded = false;
      player.allIn = false;
    }

    // Post blinds
    const sbIndex = (this.state.dealerPosition + 1) % this.state.players.length;
    const bbIndex = (this.state.dealerPosition + 2) % this.state.players.length;

    this.placeBet(sbIndex, this.state.smallBlind, true);
    this.placeBet(bbIndex, this.state.bigBlind, true);

    // Start with player after big blind
    this.state.activePlayerIndex = (this.state.dealerPosition + 3) % this.state.players.length;
    this.skipFoldedAndAllInPlayers();
  }

  private placeBet(playerIndex: number, amount: number, isBlind = false): void {
    const player = this.state.players[playerIndex];
    const actualBet = Math.min(amount, player.chips);
    player.chips -= actualBet;
    player.bet += actualBet;
    this.state.pot += actualBet;

    if (player.chips === 0) {
      player.allIn = true;
    }

    if (!isBlind && actualBet > this.state.currentBet) {
      this.state.currentBet = actualBet;
    }
  }

  private skipFoldedAndAllInPlayers(): void {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) {
      this.endHand();
      return;
    }

    while (
      this.state.players[this.state.activePlayerIndex].folded ||
      this.state.players[this.state.activePlayerIndex].allIn
    ) {
      this.state.activePlayerIndex =
        (this.state.activePlayerIndex + 1) % this.state.players.length;
    }
  }

  private getActivePlayers(): PlayerState[] {
    return this.state.players.filter((p) => !p.folded);
  }

  action(playerId: string, action: string, amount?: number): { success: boolean; error?: string; handComplete?: boolean; winners?: string[] } {
    const playerIndex = this.state.players.findIndex((p) => p.id === playerId);

    if (playerIndex === -1) return { success: false, error: "Player not found" };
    if (playerIndex !== this.state.activePlayerIndex) return { success: false, error: "Not your turn" };
    if (this.state.phase === 'waiting' || this.state.phase === 'showdown') {
      return { success: false, error: "Game not in progress" };
    }

    const player = this.state.players[playerIndex];

    switch (action) {
      case 'fold':
        player.folded = true;
        break;

      case 'check':
        if (player.bet < this.state.currentBet) {
          return { success: false, error: "Cannot check, must call or raise" };
        }
        break;

      case 'call':
        const callAmount = this.state.currentBet - player.bet;
        if (callAmount > 0) {
          this.placeBet(playerIndex, callAmount);
        }
        break;

      case 'raise':
        if (!amount || amount <= this.state.currentBet) {
          return { success: false, error: "Invalid raise amount" };
        }
        const raiseAmount = amount - player.bet;
        this.placeBet(playerIndex, raiseAmount);
        break;

      default:
        return { success: false, error: "Invalid action" };
    }

    // Move to next player
    this.state.activePlayerIndex = (this.state.activePlayerIndex + 1) % this.state.players.length;

    // Check if betting round complete
    if (this.isBettingRoundComplete()) {
      this.advancePhase();
    } else {
      this.skipFoldedAndAllInPlayers();
    }

    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 1) {
      this.endHand();
      return {
        success: true,
        handComplete: true,
        winners: activePlayers.map((p) => p.id),
      };
    }

    if (this.state.phase === 'showdown') {
      const winners = this.determineWinners();
      this.endHand();
      return { success: true, handComplete: true, winners };
    }

    return { success: true };
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = this.getActivePlayers().filter((p) => !p.allIn);
    if (activePlayers.length === 0) return true;

    const allBetsEqual = activePlayers.every(
      (p) => p.bet === this.state.currentBet || p.allIn
    );

    return allBetsEqual;
  }

  private advancePhase(): void {
    // Reset bets for new round
    for (const player of this.state.players) {
      player.bet = 0;
    }
    this.state.currentBet = 0;

    switch (this.state.phase) {
      case 'preflop':
        this.state.communityCards.push(this.deck.pop()!, this.deck.pop()!, this.deck.pop()!);
        this.state.phase = 'flop';
        break;
      case 'flop':
        this.state.communityCards.push(this.deck.pop()!);
        this.state.phase = 'turn';
        break;
      case 'turn':
        this.state.communityCards.push(this.deck.pop()!);
        this.state.phase = 'river';
        break;
      case 'river':
        this.state.phase = 'showdown';
        break;
    }

    // Set active player to first after dealer
    this.state.activePlayerIndex = (this.state.dealerPosition + 1) % this.state.players.length;
    this.skipFoldedAndAllInPlayers();
  }

  private determineWinners(): string[] {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 0) return [];

    const handStrengths = activePlayers.map((player) => ({
      player,
      strength: this.evaluateHand(player.cards, this.state.communityCards),
    }));

    handStrengths.sort((a, b) => b.strength.score - a.strength.score);
    const bestScore = handStrengths[0].strength.score;

    return handStrengths
      .filter((h) => h.strength.score === bestScore)
      .map((h) => h.player.id);
  }

  private evaluateHand(holeCards: Card[], communityCards: Card[]): { score: number; hand: string } {
    const allCards = [...holeCards, ...communityCards];

    // Simple evaluation - check for pairs, trips, etc.
    const rankCounts = new Map<number, number>();
    for (const card of allCards) {
      rankCounts.set(card.value, (rankCounts.get(card.value) || 0) + 1);
    }

    const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

    if (counts[0] === 4) return { score: 700 + this.kicker(rankCounts, 4), hand: 'Four of a Kind' };
    if (counts[0] === 3 && counts[1] === 2) return { score: 600, hand: 'Full House' };
    if (counts[0] === 3) return { score: 300 + this.kicker(rankCounts, 3), hand: 'Three of a Kind' };
    if (counts[0] === 2 && counts[1] === 2) return { score: 200, hand: 'Two Pair' };
    if (counts[0] === 2) return { score: 100 + this.kicker(rankCounts, 2), hand: 'One Pair' };

    // High card
    const sorted = allCards.map((c) => c.value).sort((a, b) => b - a);
    return { score: sorted[0], hand: 'High Card' };
  }

  private kicker(rankCounts: Map<number, number>, match: number): number {
    for (const [rank, count] of rankCounts) {
      if (count === match) return rank;
    }
    return 0;
  }

  private endHand(): void {
    const winners = this.determineWinners();
    const winAmount = Math.floor(this.state.pot / winners.length);

    for (const player of this.state.players) {
      if (winners.includes(player.id)) {
        player.chips += winAmount;
      }
    }

    this.state.phase = 'waiting';
    this.state.winners = winners;
  }

  getPublicState() {
    return {
      ...this.state,
      players: this.state.players.map((p) => ({
        ...p,
        cards: p.cards.length > 0 ? [{ hidden: true }, { hidden: true }] : [],
      })),
    };
  }

  getPrivateState(playerId: string) {
    const player = this.state.players.find((p) => p.id === playerId);
    return {
      ...this.state,
      myCards: player?.cards || [],
    };
  }
}

export function createGame(groupId: string): GameManager {
  const game = new GameManager(groupId);
  games.set(groupId, game);
  return game;
}

export function getGame(groupId: string): GameManager | undefined {
  return games.get(groupId);
}

export function startGame(groupId: string): boolean {
  const game = games.get(groupId);
  if (!game) return false;
  return game.start();
}

export function handlePlayerAction(
  groupId: string,
  playerId: string,
  action: string,
  amount?: number
): { success: boolean; error?: string; handComplete?: boolean; winners?: string[] } {
  const game = games.get(groupId);
  if (!game) return { success: false, error: "Game not found" };
  return game.action(playerId, action, amount);
}

export function removePlayer(groupId: string, playerId: string): void {
  const game = games.get(groupId);
  if (game) {
    game.removePlayer(playerId);
  }
}
