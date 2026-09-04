import fs from 'fs'
import path from 'path'

// Native .env file loader for the Electron process without extra dependencies
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  } catch {
    // Ignore error if .env cannot be read
  }
}

loadEnv()

const DEFAULT_CDN_URL = process.env.VITE_CDN_URL?.trim() || 'https://cdn.tudominio.com'

export const LAUNCHER_CONFIG = {
  // Base URL of your CDN (e.g. 'https://cdn.dominiocraft.com')
  cdnUrl: DEFAULT_CDN_URL,

  // Direct URL to the modpack manifest JSON
  // If not set in .env, defaults to ${cdnUrl}/modpack.json
  modpackUrl: process.env.VITE_MODPACK_URL?.trim() || `${DEFAULT_CDN_URL}/modpack.json`,

  // Direct URL to the news feed JSON
  // If not set in .env, defaults to ${cdnUrl}/news.json
  newsUrl: process.env.VITE_NEWS_URL?.trim() || `${DEFAULT_CDN_URL}/news.json`,

  // Minecraft & Loader setup
  minecraft: {
    version: '1.21.1',
    loader: {
      loader: 'neoforge' as const,
      version: '21.1.248'
    }
  },

  // Game root directory name (will be created as .Dominio Craft)
  gameRoot: 'Dominio Craft',
  profileSlug: 'dominio'
}
