# Poker - Modern Social Poker Experience

A minimal, real-time poker application built with React, TypeScript, and Bun. Deploys seamlessly to Vercel.

![Poker Screenshot](https://via.placeholder.com/800x400/0a1912/d4af37?text=Poker)

## Features

- **Modern UI**: Dark theme with gold accents, clean typography
- **Real-time Gameplay**: WebSocket support (local) / HTTP polling (Vercel)
- **Texas Hold'em**: Full poker game logic with betting rounds
- **Group System**: Create/join tables with unique IDs
- **Responsive**: Works on desktop, tablet, and mobile

## Quick Start

### Local Development (with Bun)

```bash
# Install dependencies
bun install

# Run the dev server
bun dev

# Open http://localhost:3000
```

### Deploy to Vercel

#### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/poker)

#### Option 2: CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Project Structure

```
/
├── api/
│   └── index.ts          # Vercel API routes (serverless)
├── backend/
│   ├── game.ts           # Poker game logic
│   └── groups.ts         # Group management
├── frontend/
│   ├── components/       # React components
│   ├── hooks/           # Custom hooks (WebSocket + HTTP)
│   ├── app.tsx          # Main app
│   └── styles.css       # Styles
├── index.html           # Entry HTML
├── index.ts             # Bun server (local dev)
├── vercel.json          # Vercel config
└── package.json
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VERCEL` | Auto-set by Vercel | No |

## Architecture

### Local Development (Bun)
- **Server**: Bun.serve() with WebSocket support
- **State**: In-memory (per server instance)
- **Transport**: WebSocket for real-time updates

### Vercel Deployment
- **API**: Serverless functions (`/api/*`)
- **State**: In-memory (resets on cold start)
- **Transport**: HTTP polling (500ms interval)

**Note**: For production use with Vercel, consider adding Redis (Upstash) for state persistence across serverless invocations.

## Game Rules

- Texas Hold'em poker
- 2-8 players per table
- Starting chips: 1000
- Small blind: 10, Big blind: 20
- Standard hand rankings apply

## Technologies

- **Frontend**: React 18, CSS Modules
- **Backend**: Bun (local) / Vercel Functions (deployed)
- **Real-time**: WebSocket (local) / HTTP polling (Vercel)
- **Build**: Bun bundler

## License

MIT
