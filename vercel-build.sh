#!/bin/bash
set -e

echo "Building Poker app for Vercel..."

# Install dependencies
bun install

# Build the frontend
echo "Building frontend..."
bun build ./frontend/app.tsx --outdir=dist --target=browser --format=esm

# Copy HTML to dist
cp index.html dist/index.html

echo "Build complete!"
