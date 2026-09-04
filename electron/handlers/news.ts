import { ipcMain } from 'electron'
import logger from 'electron-log/main'
import { LAUNCHER_CONFIG } from '../config'

export interface INewsTagItem {
  id?: string
  name: string
  color: string
}

export interface INewsAuthorItem {
  id?: string
  username: string
}

export interface INewsItem {
  id?: string
  title: string
  content: string
  author?: INewsAuthorItem | string
  createdAt?: string | Date
  updatedAt?: string | Date | null
  categories?: any[]
  tags?: INewsTagItem[] | string[]
  image?: string
}

export function registerNewsHandlers() {
  ipcMain.handle('news:get_news', async () => {
    const url = LAUNCHER_CONFIG.newsUrl

    if (!url || url.includes('tudominio.com')) {
      logger.info('News CDN URL is not set or using placeholder (tudominio.com). Skipping remote fetch.')
      return []
    }

    try {
      logger.log(`Fetching news from CDN: ${url}`)
      const response = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: {
          Accept: 'application/json',
          'User-Agent': 'DominioLauncher/0.1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Support either direct array [ ... ] or wrapped { news: [ ... ] } / { data: [ ... ] }
      if (Array.isArray(data)) {
        return data as INewsItem[]
      } else if (data && Array.isArray(data.news)) {
        return data.news as INewsItem[]
      } else if (data && Array.isArray(data.data)) {
        return data.data as INewsItem[]
      }

      logger.warn('Unrecognized news format from CDN, expected an array or { news: [...] }')
      return []
    } catch (err: any) {
      logger.warn(`Could not fetch news from CDN (${url}): ${err?.message || err}`)
      return []
    }
  })

  ipcMain.handle('news:get_categories', async () => {
    return []
  })
}
