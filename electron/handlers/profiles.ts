import { ipcMain } from 'electron'
import { Profiles } from 'eml-lib'
import logger from 'electron-log/main'
import { ADMINTOOL_URL } from '../const'
import { LAUNCHER_CONFIG } from '../config'

export const DEFAULT_PROFILES = [
  {
    id: 'dominio-neoforge-1-21-1',
    name: 'NeoForge 1.21.1',
    slug: LAUNCHER_CONFIG.profileSlug,
    isDefault: true,
    minecraft: {
      version: LAUNCHER_CONFIG.minecraft.version,
      loader: {
        loader: LAUNCHER_CONFIG.minecraft.loader.loader,
        version: LAUNCHER_CONFIG.minecraft.loader.version
      }
    }
  }
]

export function registerProfilesHandlers() {
  ipcMain.handle('profiles:get', async () => {
    try {
      if (!ADMINTOOL_URL || ADMINTOOL_URL.includes('tudominio.com') || ADMINTOOL_URL.includes('localhost')) {
        return DEFAULT_PROFILES
      }

      const profiles = new Profiles(ADMINTOOL_URL)
      const list = await profiles.getProfiles()
      if (list && list.length > 0) {
        const sorted = [list.find((p) => p.isDefault) || list[0], ...list.filter((p) => !p.isDefault)]
        return sorted
      }
      return DEFAULT_PROFILES
    } catch (err) {
      logger.info('Using default profile (NeoForge 1.21.1):', err)
      return DEFAULT_PROFILES
    }
  })
}
