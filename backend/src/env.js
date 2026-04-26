import fs from 'node:fs'
import path from 'node:path'

/*
  Loads simple KEY=value pairs from backend/.env without adding a dotenv
  dependency. Existing environment variables still win, which is useful in
  cloud hosting dashboards.
*/
export function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')

  if (!fs.existsSync(envPath)) return

  const lines = fs.readFileSync(envPath, 'utf8').split('\n')

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) return

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()

    if (!process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, '')
    }
  })
}
