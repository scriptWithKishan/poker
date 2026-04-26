#!/usr/bin/env bun
import { build } from "bun";
import { cp, writeFile } from "fs/promises";

console.log("Building Poker app for production...");

// Build the frontend
const result = await build({
  entrypoints: ["./frontend/app.tsx"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}

// Create the HTML file with correct paths
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Poker - Modern Social Poker Experience</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #0a1912;
      --primary-light: #152921;
      --secondary: #2d4a3e;
      --accent: #d4af37;
      --accent-light: #f4d76b;
      --text: #f5f5f5;
      --text-muted: #9ca3af;
      --error: #ef4444;
      --success: #22c55e;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--primary);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
    }

    .display {
      font-family: 'Space Grotesk', sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>
`;

await writeFile("./dist/index.html", html);

console.log("✅ Build complete!");
console.log("  - dist/app.js");
console.log("  - dist/app.css");
console.log("  - dist/index.html");
