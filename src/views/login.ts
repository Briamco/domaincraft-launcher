import { setUser, setView } from '../state'
import { auth, skin } from '../ipc'
import { Dialog } from './dialog'
import logger from 'electron-log/renderer'

export function initLogin() {
  const tabBtnOffline = document.getElementById('tab-btn-offline') as HTMLButtonElement | null
  const tabBtnMs = document.getElementById('tab-btn-ms') as HTMLButtonElement | null
  const panelOffline = document.getElementById('login-tab-offline') as HTMLElement | null
  const panelMs = document.getElementById('login-tab-ms') as HTMLElement | null

  const btnOffline = document.getElementById('btn-login-offline') as HTMLButtonElement | null
  const inputUsername = document.getElementById('input-offline-username') as HTMLInputElement | null
  const errorOffline = document.getElementById('offline-error') as HTMLElement | null

  const btnMs = document.getElementById('btn-login-ms') as HTMLButtonElement | null

  // Switch to Offline Tab
  tabBtnOffline?.addEventListener('click', () => {
    tabBtnOffline.classList.add('active')
    tabBtnMs?.classList.remove('active')
    panelOffline?.classList.add('active')
    panelMs?.classList.remove('active')
    inputUsername?.focus()
  })

  // Switch to Microsoft Tab
  tabBtnMs?.addEventListener('click', () => {
    tabBtnMs.classList.add('active')
    tabBtnOffline?.classList.remove('active')
    panelMs?.classList.add('active')
    panelOffline?.classList.remove('active')
  })

  const showError = (msg: string) => {
    if (errorOffline) {
      errorOffline.innerText = msg
      errorOffline.classList.remove('hidden')
    }
  }

  const hideError = () => {
    if (errorOffline) {
      errorOffline.innerText = ''
      errorOffline.classList.add('hidden')
    }
  }

  inputUsername?.addEventListener('input', () => {
    hideError()
  })

  // Offline login handler
  const handleOfflineLogin = async () => {
    if (!inputUsername || !btnOffline) return
    const username = inputUsername.value.trim()

    if (!username) {
      showError('Por favor ingresa un nombre de usuario.')
      inputUsername.focus()
      return
    }

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
      showError('El nombre debe tener entre 3 y 16 caracteres (solo letras, números y guión bajo).')
      inputUsername.focus()
      return
    }

    hideError()
    const originalText = btnOffline.innerHTML

    btnOffline.disabled = true
    btnOffline.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Entrando...'

    try {
      const session = await auth.loginOffline(username)

      if (session.success) {
        const [__, skins, capes, avatar] = await Promise.all([
          skin.reload(session.account),
          skin.getSkin(session.account),
          skin.getCape(session.account),
          skin.getAvatar(session.account)
        ])

        await setUser(session.account, { skins: skins ?? [], capes: capes ?? [], avatar })
        setView('home')
      } else {
        logger.error('Login offline error:', session.error)
        showError(session.error || 'Error al iniciar sesión offline.')
      }
    } catch (err: any) {
      logger.error('Error during offline login:', err)
      showError('Ocurrió un error al iniciar sesión en modo offline.')
    } finally {
      btnOffline.disabled = false
      btnOffline.innerHTML = originalText
    }
  }

  inputUsername?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleOfflineLogin()
    }
  })

  btnOffline?.addEventListener('click', handleOfflineLogin)

  // Microsoft login handler
  btnMs?.addEventListener('click', async () => {
    const originalText = btnMs.innerHTML

    btnMs.disabled = true
    btnMs.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Conectando...'

    try {
      const session = await auth.login()

      if (session.success) {
        const [__, skins, capes, avatar] = await Promise.all([
          skin.reload(session.account),
          skin.getSkin(session.account),
          skin.getCape(session.account),
          skin.getAvatar(session.account)
        ])

        await setUser(session.account, { skins: skins ?? [], capes: capes ?? [], avatar })
        setView('home')
      } else {
        logger.error(session.error)
        await Dialog.show('Error al iniciar sesión con Microsoft.', [{ text: 'OK', type: 'ok' }])
      }
    } catch (err) {
      logger.error(err)
      await Dialog.show('Ocurrió un error al iniciar sesión.', [{ text: 'OK', type: 'ok' }])
    } finally {
      btnMs.disabled = false
      btnMs.innerHTML = originalText
    }
  })
}

