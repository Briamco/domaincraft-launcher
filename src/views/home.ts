import { setView, getUser } from '../state'
import { game, news, server, settings, profiles } from '../ipc'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import logger from 'electron-log/renderer'

marked.use({
  renderer: {
    link(link) {
      const href = link.href ?? '#'
      const titleAttr = link.title ? ` title="${link.title}"` : ''
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${link.text}</a>`
    }
  }
})

const formatDate = (dateString?: string | Date) => {
  if (!dateString) return new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })
}

const parseNews = (rawContent: string) =>
  DOMPurify.sanitize(marked.parse(rawContent) as string, {
    ADD_ATTR: ['target']
  })

const backgroundColor = (color?: string) => {
  if (!color || !color.startsWith('#') || color.length < 7) {
    return 'rgba(44, 168, 69, 0.15)'
  }
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.15)`
}

export function initHome() {
  const body = document.body
  const playBtn = document.getElementById('btn-play')
  const settingsBtn = document.getElementById('btn-settings')
  const progressContainer = document.getElementById('launch-progress-container')
  const progressBar = document.getElementById('launch-progress-bar')
  const progressLabel = document.getElementById('launch-progress-label')
  const progressPercent = document.getElementById('launch-progress-percent')
  const statusDot = document.getElementById('server-status-dot')
  const statusText = document.getElementById('server-status-text')
  const playerCount = document.getElementById('player-count')
  const newsList = document.getElementById('news-list')
  const profileSelector = document.getElementById('profile-selector')
  const profileDropdown = document.getElementById('profile-dropdown')
  const currentProfileName = document.getElementById('current-profile-name')

  let selectedProfile: any = null
  let allProfiles: any[] = []
  let totalToDownload = 0
  let totalDownloadedByType: { type: string; size: number }[] = []

  const DEFAULT_PROFILE = {
    id: 'dominio-neoforge-1-21-1',
    name: 'NeoForge 1.21.1',
    slug: 'dominio',
    isDefault: true
  }

  const loadProfiles = async () => {
    try {
      const fetched = await profiles.get()
      allProfiles = fetched && fetched.length > 0 ? fetched : [DEFAULT_PROFILE]
    } catch {
      allProfiles = [DEFAULT_PROFILE]
    }

    const defaultProfile = allProfiles.find((p) => p.isDefault) || allProfiles[0]
    selectProfile(defaultProfile)
    renderDropdown()
  }

  const renderDropdown = () => {
    if (!profileDropdown) return
    profileDropdown.innerHTML = allProfiles
      .map(
        (p) => `
      <div class="profile-option ${selectedProfile?.id === p.id ? 'active' : ''}" data-id="${p.id}">
        ${p.name}
      </div>
    `
      )
      .join('')

    profileDropdown.querySelectorAll('.profile-option').forEach((opt) => {
      opt.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id
        const profile = allProfiles.find((p) => p.id === id)
        if (profile) selectProfile(profile)
        profileSelector?.classList.remove('open')
      })
    })
  }

  const selectProfile = (profile: any) => {
    selectedProfile = profile
    if (currentProfileName) currentProfileName.innerText = profile.name
    renderDropdown()
    updateServerStatus()
  }

  const updateServerStatus = async () => {
    if (statusDot) {
      statusDot.classList.remove('online', 'offline')
      statusDot.classList.add('pinging')
    }
    if (statusText) statusText.innerHTML = 'Pinging...'
    if (playerCount) playerCount.innerHTML = ''

    const status = selectedProfile?.ip ? await server.getStatus(selectedProfile.ip, selectedProfile.port || 25565) : null

    if (status) {
      if (statusDot) {
        statusDot.style.display = 'block'
        statusDot.classList.remove('pinging', 'offline')
        statusDot.classList.add('online')
      }
      if (statusText) statusText.innerHTML = 'Online'

      if (playerCount) {
        playerCount.innerHTML = `<i class="fa-fw fa-solid fa-users"></i>&nbsp;&nbsp;${status.players.online.toLocaleString()} / ${status.players.max.toLocaleString()}`
      }
    } else if (selectedProfile?.ip) {
      if (statusDot) {
        statusDot.style.display = 'block'
        statusDot.classList.remove('pinging', 'online')
        statusDot.classList.add('offline')
      }
      if (statusText) statusText.innerHTML = 'Offline'
      if (playerCount) playerCount.innerHTML = ''
    } else {
      if (statusDot) statusDot.style.display = 'none'
      if (statusText) statusText.innerHTML = 'NeoForge 1.21.1'
      if (playerCount) playerCount.innerHTML = ''
    }
  }

  const loadNews = async () => {
    if (!newsList) return
    newsList.innerHTML = '<div style="text-align:center; padding: 20px; color: #888;"><i class="fa-solid fa-circle-notch fa-spin"></i>&nbsp;&nbsp;Cargando noticias...</div>'
    const feed = await news.getNews()

    newsList.innerHTML = ''

    if (!feed || feed.length === 0) {
      newsList.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; color: #888;">
          <i class="fa-solid fa-newspaper" style="font-size: 30px; margin-bottom: 12px; opacity: 0.4;"></i>
          <p style="font-size: 14px; margin-bottom: 4px; color: #ccc;">No hay noticias disponibles por el momento.</p>
          <small style="opacity: 0.6;">Las novedades y eventos del servidor se sincronizarán aquí.</small>
        </div>
      `
      return
    }

    feed.forEach((item: any) => {
      let tagsHTML = ''
      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag: any) => {
          if (typeof tag === 'string') {
            tagsHTML += `<span class="tag" style="color: #2ca845; background-color: rgba(44, 168, 69, 0.15)">${tag}</span>`
          } else if (tag && tag.name) {
            const color = tag.color || '#2ca845'
            tagsHTML += `<span class="tag" style="color: ${color}; background-color: ${backgroundColor(color)}">${tag.name}</span>`
          }
        })
      }

      const authorName = typeof item.author === 'string'
        ? item.author
        : item.author?.username || 'Dominio Craft'

      const articleHTML = `
        <article class="news-article">
          <div class="article-meta">
            <div class="author">
              <img src="https://minotar.net/helm/${authorName}/24" alt="Author" onerror="this.src='https://minotar.net/helm/Steve/24'"/>
              <span>${authorName}</span>
            </div>
            <span class="separator">•</span>
            <span class="date">${formatDate(item.createdAt)}</span>
            ${tagsHTML ? `<span class="separator">•</span><div class="tags-container">${tagsHTML}</div>` : ''}
          </div>

          <h3>${item.title || 'Novedades'}</h3>
          
          ${item.image ? `<img src="${item.image}" alt="News Image" onerror="this.style.display='none'"/>` : ''}

          <div class="article-content">
            ${parseNews(item.content || '')}
          </div>
        </article>
      `

      newsList.insertAdjacentHTML('beforeend', articleHTML)
    })
  }

  loadProfiles()
  updateServerStatus()
  loadNews()

  const setIndeterminate = (active: boolean) => {
    if (!progressBar || !progressPercent) return

    if (active) {
      progressBar.classList.add('indeterminate')
      progressPercent.style.display = 'none'
    } else {
      progressBar.classList.remove('indeterminate')
      progressPercent.style.display = 'block'
    }
  }

  settingsBtn?.addEventListener('click', () => {
    setView('settings')
  })

  playBtn?.addEventListener('click', async () => {
    setIndeterminate(true)
    if (playBtn) playBtn.style.display = 'none'
    if (progressContainer) progressContainer.classList.remove('hidden')
    if (progressBar) progressBar.style.width = '0%'
    if (progressPercent) progressPercent.innerText = '0%'

    const user = getUser()
    if (!user) return

    const config = await settings.get()

    const message = `
Ready to launch the game with the following settings:
      
👤 Account: ${user.name}
🧠 RAM: ${config.memory.min} - ${config.memory.max}
☕️ Java: ${config.java}
🖥️ Resolution: ${config.resolution.width}x${config.resolution.height}
🚀 Action on launch: ${config.launcherAction}
    `

    logger.log(message)
    game.launch({ account: user, settings: config, profileSlug: selectedProfile?.slug })
  })

  profileSelector?.querySelector('.selected-profile')?.addEventListener('click', () => {
    profileSelector.classList.toggle('open')
  })

  body.addEventListener('click', (e) => {
    if (!profileSelector?.contains(e.target as Node)) {
      profileSelector?.classList.remove('open')
    }
  })

  const getDownloadTypeLabel = (type: string) => {
    switch (type) {
      case 'JAVA':
        return 'Descargando Java...'
      case 'MOD':
        return 'Descargando mods...'
      case 'SHADERPACK':
        return 'Descargando shaders...'
      case 'RESOURCEPACK':
        return 'Descargando paquetes de recursos...'
      case 'CONFIG':
        return 'Descargando configuraciones...'
      case 'ASSET':
        return 'Descargando recursos...'
      case 'LIBRARY':
        return 'Descargando librerías...'
      default:
        return 'Descargando archivos del juego...'
    }
  }

  game.launchComputeDownload(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Preparando descarga...'
    if (progressPercent) progressPercent.innerText = ''
  })
  game.launchDownload((download) => {
    setIndeterminate(false)
    totalToDownload = download.total.size
    if (progressLabel) progressLabel.innerText = 'Descargando archivos...'
  })
  game.downloadProgress((progress) => {
    if (!totalDownloadedByType.find((t) => t.type === progress.type)) {
      totalDownloadedByType.push({ type: progress.type, size: progress.downloaded.size })
    } else {
      totalDownloadedByType[totalDownloadedByType.findIndex((t) => t.type === progress.type)].size = progress.downloaded.size
    }
    if (progressBar && progressLabel && progressPercent) {
      const downloadedSum = totalDownloadedByType.reduce((acc, curr) => acc + curr.size, 0)
      progressBar.style.width = `${Math.min((downloadedSum / totalToDownload) * 100, 100)}%`
      progressLabel.innerText = getDownloadTypeLabel(progress.type)
      progressPercent.innerText = `${Math.round(Math.min((downloadedSum / totalToDownload) * 100, 100))}%`
    }
  })
  game.launchInstallLoader(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Instalando modloader...'
    if (progressPercent) progressPercent.innerText = ''
  })
  game.launchExtractNatives(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Extracting files...'
  })
  game.launchCopyAssets(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Extracting files...'
  })
  game.launchPatchLoader(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Finalizing setup...'
  })
  game.launchLaunch(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Launching game...'
  })
  game.launched(() => {
    setTimeout(() => {
      if (playBtn) playBtn.style.display = 'block'
      if (progressContainer) progressContainer.classList.add('hidden')
      if (progressBar) progressBar.style.width = '0%'
      if (progressPercent) progressPercent.innerText = ''
    }, 10000)
  })
}





