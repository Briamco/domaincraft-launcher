import { ipcMain, app } from 'electron'
import { MicrosoftAuth, CrackAuth } from 'eml-lib'
import type { Account } from 'eml-lib'
import logger from 'electron-log/main'
import * as fs from 'node:fs'
import * as path from 'node:path'

const sessionPath = path.join(app.getPath('userData'), 'session.json')

export type IAuthResponse = { success: true; account: Account } | { success: false; error: string }

export function registerAuthHandlers(mainWindow: Electron.BrowserWindow) {
  const auth = new MicrosoftAuth(mainWindow)
  const crackAuth = new CrackAuth()

  ipcMain.handle('auth:login', async () => {
    try {
      const account = await auth.auth()
      fs.writeFileSync(sessionPath, JSON.stringify(account))
      return { success: true, account } as IAuthResponse
    } catch (err: any) {
      logger.error('Failed to login:', err)
      return { success: false, error: err.message ?? 'Unknown error' }
    }
  })

  ipcMain.handle('auth:login_offline', async (_event, username: string) => {
    try {
      if (!username || typeof username !== 'string') {
        return { success: false, error: 'Por favor ingresa un nombre de usuario.' } as IAuthResponse
      }
      const trimmed = username.trim()
      if (!/^[a-zA-Z0-9_]{3,16}$/.test(trimmed)) {
        return { success: false, error: 'El nombre debe tener entre 3 y 16 caracteres (solo letras, números y guión bajo).' } as IAuthResponse
      }
      const account = crackAuth.auth(trimmed)
      fs.writeFileSync(sessionPath, JSON.stringify(account, null, 2))
      return { success: true, account } as IAuthResponse
    } catch (err: any) {
      logger.error('Failed to login offline:', err)
      return { success: false, error: err.message ?? 'Unknown error' } as IAuthResponse
    }
  })

  ipcMain.handle('auth:refresh', async () => {
    if (!fs.existsSync(sessionPath)) {
      return { success: false } as { success: false }
    }

    try {
      const data = fs.readFileSync(sessionPath, 'utf-8')
      const savedSession = JSON.parse(data) as Account

      if (savedSession && savedSession.uuid) {
        if (savedSession.meta?.type === 'crack') {
          return { success: true, account: savedSession } as IAuthResponse
        }

        const valid = await auth.validate(savedSession)
        if (valid) {
          return { success: true, account: savedSession } as IAuthResponse
        }
        const account = await auth.refresh(savedSession)
        fs.writeFileSync(sessionPath, JSON.stringify(account))
        return { success: true, account } as IAuthResponse
      }
      return { success: false }
    } catch (err: any) {
      logger.error('Failed to refresh session:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('auth:logout', async () => {
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath)
    }
    return { success: true }
  })
}


