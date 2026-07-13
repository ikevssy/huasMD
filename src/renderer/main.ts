import { createEditor, getMarkdown, getHTML, setMarkdown } from './editor/editor'
import { applyTheme, loadSavedTheme, builtinThemeKeys } from './themes/theme-manager'
import { t, getLang, setLang } from './i18n'
import './themes/base.css'

function isSlidesContent(content: string): boolean {
  return /^---\s*\n[\s\S]*?(kicker|chip):/m.test(content)
}

let sourceModeActive = false
const editorEl = () => document.getElementById('editor') as HTMLElement
const sourceEl = () => document.getElementById('source-editor') as HTMLTextAreaElement
const slidesBtnEl = () => document.getElementById('slides-btn') as HTMLButtonElement
const tocBtnEl = () => document.getElementById('toc-btn') as HTMLButtonElement
const tocPanelEl = () => document.getElementById('toc-panel') as HTMLElement
const tocListEl = () => document.getElementById('toc-list') as HTMLElement
const widthToggleEl = () => document.getElementById('width-toggle') as HTMLButtonElement
const popPanelEl = () => document.getElementById('pop-panel') as HTMLElement

// ─── Source / WYSIWYG mode switching ──────────────────────────────────────────

function enterSourceMode(content: string): void {
  sourceModeActive = true
  editorEl().classList.add('hidden')
  const ta = sourceEl()
  ta.classList.add('visible')
  ta.value = content
  slidesBtnEl().classList.add('visible')
}

function exitSourceMode(): void {
  sourceModeActive = false
  editorEl().classList.remove('hidden')
  sourceEl().classList.remove('visible')
  slidesBtnEl().classList.remove('visible')
}

function setContent(content: string): void {
  if (isSlidesContent(content)) {
    enterSourceMode(content)
  } else {
    exitSourceMode()
    setMarkdown(content)
  }
  // TOC only applies in WYSIWYG mode, refresh anyway (will render empty in source mode)
  refreshTOC()
}

function getContent(): string {
  if (sourceModeActive) return sourceEl().value
  return getMarkdown()
}

// ─── i18n: apply localized text to all marked elements ────────────────────────

function applyI18n(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle!)
  })
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n!)
  })
}

// ─── Width toggle ─────────────────────────────────────────────────────────────

function initWidthToggle(): void {
  // Restore persisted width mode
  if (localStorage.getItem('huasmd-width') === 'wide') {
    document.body.classList.add('wide-mode')
    widthToggleEl().classList.add('active')
  }
  widthToggleEl().addEventListener('click', () => {
    const wide = document.body.classList.toggle('wide-mode')
    widthToggleEl().classList.toggle('active', wide)
    localStorage.setItem('huasmd-width', wide ? 'wide' : 'narrow')
  })
}

// ─── TOC outline ──────────────────────────────────────────────────────────────

interface TocEntry { level: number; text: string; el: Element }

function buildTOC(): TocEntry[] {
  const headings = document.querySelectorAll('#editor .ProseMirror h1, #editor .ProseMirror h2, #editor .ProseMirror h3, #editor .ProseMirror h4, #editor .ProseMirror h5, #editor .ProseMirror h6')
  return Array.from(headings).map(h => ({
    level: parseInt(h.tagName[1], 10),
    text: h.textContent || '',
    el: h
  }))
}

function refreshTOC(): void {
  // Hidden in source mode
  if (sourceModeActive) {
    tocListEl().innerHTML = ''
    return
  }
  const entries = buildTOC()
  if (entries.length === 0) {
    tocListEl().innerHTML = `<div class="toc-empty">${t('toc.empty')}</div>`
    return
  }
  tocListEl().innerHTML = ''
  for (const entry of entries) {
    const item = document.createElement('div')
    item.className = 'toc-item'
    // Indent by level (level 1 = 0px, deeper = more)
    item.style.paddingLeft = `${8 + (entry.level - 1) * 14}px`
    if (entry.level <= 2) item.style.fontWeight = '600'
    item.textContent = entry.text
    item.title = entry.text
    item.addEventListener('click', () => {
      entry.el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Briefly highlight the target heading
      ;(entry.el as HTMLElement).style.transition = 'background 0.3s'
      ;(entry.el as HTMLElement).style.background = 'var(--selection-bg)'
      setTimeout(() => { (entry.el as HTMLElement).style.background = '' }, 600)
    })
    tocListEl().appendChild(item)
  }
}

function initTOC(): void {
  tocBtnEl().addEventListener('click', (e) => {
    e.stopPropagation()
    const willShow = tocPanelEl().classList.contains('hidden')
    closeAllPanels()
    if (willShow) {
      refreshTOC()
      tocPanelEl().classList.remove('hidden')
      tocBtnEl().classList.add('active')
    }
  })
}

// ─── Popover panels (theme / language / export) ───────────────────────────────

let activePopover: string | null = null

function closeAllPanels(): void {
  popPanelEl().classList.add('hidden')
  activePopover = null
  document.querySelectorAll<HTMLElement>('.sb-pop').forEach(b => b.classList.remove('active'))
  tocPanelEl().classList.add('hidden')
  tocBtnEl().classList.remove('active')
  const bmPanel = document.getElementById('bookmark-panel')
  if (bmPanel) bmPanel.classList.add('hidden')
}

function positionPanel(triggerBtn: HTMLElement): void {
  const panel = popPanelEl()
  const rect = triggerBtn.getBoundingClientRect()
  panel.classList.remove('hidden')
  // Measure after un-hiding
  const panelWidth = panel.offsetWidth
  let left = rect.right - panelWidth
  if (left < 8) left = 8
  panel.style.left = `${left}px`
}

function renderThemePanel(): void {
  const api = window.electronAPI
  const current = loadSavedTheme()
  const items: string[] = []

  items.push(`<div class="pop-section">${t('panel.theme')}</div>`)
  for (const key of builtinThemeKeys) {
    const isActive = current === key
    items.push(`<div class="pop-item${isActive ? ' active' : ''}" data-theme="${key}">
      <span>${t('theme.' + key)}</span>
      ${isActive ? '<span class="check">✓</span>' : ''}
    </div>`)
  }

  // Custom themes (loaded asynchronously after initial render)
  items.push(`<div class="pop-section">${t('theme.custom')}</div>`)
  items.push(`<div id="custom-theme-list"></div>`)
  items.push(`<div class="pop-item" id="import-theme-item">${t('theme.import')}</div>`)

  popPanelEl().innerHTML = items.join('')

  // Wire theme clicks
  popPanelEl().querySelectorAll<HTMLElement>('[data-theme]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.theme!
      applyTheme(key)
      // Update checkmarks in-place without closing/reopening
      popPanelEl().querySelectorAll<HTMLElement>('[data-theme]').forEach(el2 => {
        const check = el2.querySelector('.check')
        if (el2.dataset.theme === key) {
          if (!check) { const s = document.createElement('span'); s.className = 'check'; s.textContent = '✓'; el2.appendChild(s) }
        } else {
          if (check) check.remove()
        }
      })
      // Wait for async custom theme list to update, then close
      setTimeout(() => closeAllPanels(), 200)
    })
  })

  // Import custom theme
  document.getElementById('import-theme-item')?.addEventListener('click', async () => {
    const result = await api.loadCustomTheme()
    if (result) {
      applyTheme(`custom:${result.name}`, result.css)
    }
    closeAllPanels()
  })

  // Load custom themes list
  api.getCustomThemes().then(names => {
    const listEl = document.getElementById('custom-theme-list')
    if (!listEl) return
    if (names.length === 0) {
      listEl.innerHTML = ''
      return
    }
    listEl.innerHTML = names.map(name => {
      const key = name.replace(/\.css$/, '')
      const isActive = current === `custom:${name}`
      return `<div class="pop-item${isActive ? ' active' : ''}" data-custom-theme="${name}">
        <span>${key}</span>
        ${isActive ? '<span class="check">✓</span>' : ''}
      </div>`
    }).join('')
    listEl.querySelectorAll<HTMLElement>('[data-custom-theme]').forEach(el => {
      el.addEventListener('click', async () => {
        const fileName = el.dataset.customTheme!
        const css = await api.loadThemeCSS(fileName)
        if (css) applyTheme(`custom:${fileName}`, css)
        closeAllPanels()
      })
    })
  }).catch(() => {})
}

function renderLanguagePanel(): void {
  const current = getLang()
  popPanelEl().innerHTML = `
    <div class="pop-section">${t('panel.language')}</div>
    <div class="pop-item${current === 'zh' ? ' active' : ''}" data-lang="zh">
      <span>${t('lang.zh')}</span>${current === 'zh' ? '<span class="check">✓</span>' : ''}
    </div>
    <div class="pop-item${current === 'en' ? ' active' : ''}" data-lang="en">
      <span>${t('lang.en')}</span>${current === 'en' ? '<span class="check">✓</span>' : ''}
    </div>
  `
  popPanelEl().querySelectorAll<HTMLElement>('[data-lang]').forEach(el => {
    el.addEventListener('click', () => {
      const lang = el.dataset.lang as 'zh' | 'en'
      if (lang === current) { closeAllPanels(); return }
      setLang(lang)
      applyI18n()
      closeAllPanels()
    })
  })
}

function renderExportPanel(): void {
  const api = window.electronAPI
  popPanelEl().innerHTML = `
    <div class="pop-section">${t('panel.export')}</div>
    <div class="pop-item" data-export="pptx"><span>${t('export.pptx')}</span></div>
    <div class="pop-item" data-export="pdf"><span>${t('export.pdf')}</span></div>
    <div class="pop-item" data-export="slides"><span>${t('export.slides_html')}</span></div>
    <div class="pop-item" data-export="html"><span>${t('export.html')}</span></div>
    <div class="pop-item" data-export="open-as-slides"><span>${t('export.open_as_slides')}</span></div>
  `
  popPanelEl().querySelectorAll<HTMLElement>('[data-export]').forEach(el => {
    el.addEventListener('click', () => {
      const action = el.dataset.export
      closeAllPanels()
      if (action === 'pdf') api.exportPDF()
      else if (action === 'html') triggerExportHTML()
      else if (action === 'slides') api.exportSlides(getContent())
      else if (action === 'pptx') api.exportPptx(getContent())
      else if (action === 'open-as-slides') api.openAsSlides(getContent())
    })
  })
}

function openPopover(name: string): void {
  const trigger = document.querySelector<HTMLElement>(`.sb-pop[data-pop="${name}"]`)
  if (!trigger) return

  // Toggle off if clicking the same active popover
  if (activePopover === name) {
    closeAllPanels()
    return
  }

  closeAllPanels()
  activePopover = name
  trigger.classList.add('active')

  if (name === 'theme') renderThemePanel()
  else if (name === 'language') renderLanguagePanel()
  else if (name === 'export') renderExportPanel()

  positionPanel(trigger)
}

function initStatusbar(): void {
  const api = window.electronAPI

  // Direct action buttons
  document.querySelectorAll<HTMLElement>('.sb-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action
      closeAllPanels()
      if (action === 'new') {
        exitSourceMode()
        setMarkdown('')
        refreshTOC()
      } else if (action === 'open') {
        api.openFile().then(result => { if (result) setContent(result.content) })
      } else if (action === 'save') {
        api.saveFile(getContent())
      }
    })
  })

  // Popover trigger buttons
  document.querySelectorAll<HTMLElement>('.sb-pop').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      openPopover(btn.dataset.pop!)
    })
  })
}

// ─── Export HTML (preserved from original) ────────────────────────────────────

function triggerExportHTML(): void {
  const api = window.electronAPI
  const s = getComputedStyle(document.body)
  const v = (name: string) => s.getPropertyValue(name).trim()
  const bgColor = v('--bg-color')
  const textColor = v('--text-color')
  const textMuted = v('--text-muted')
  const borderColor = v('--border-color')
  const linkColor = v('--link-color')
  const codeBg = v('--code-bg')
  const codeBlockBg = v('--code-block-bg')
  const codeBlockText = v('--code-block-text') || textColor
  const blockquoteBorder = v('--blockquote-border')
  const blockquoteBg = v('--blockquote-bg') || 'transparent'
  const tableHeaderBg = v('--table-header-bg')
  const selectionBg = v('--selection-bg')

  const editor = document.querySelector('#editor .ProseMirror')
  const fontFamily = editor ? getComputedStyle(editor).fontFamily : '-apple-system,BlinkMacSystemFont,sans-serif'

  const getElColor = (selector: string, fallback: string): string => {
    const el = document.querySelector(`#editor .ProseMirror ${selector}`)
    return el ? getComputedStyle(el).color : fallback
  }
  const strongColor = getElColor('strong', textColor)
  const codeColor = getElColor('code', textColor)

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>huasMD Export</title>
<style>
body{max-width:780px;margin:40px auto;padding:20px;font-family:${fontFamily};line-height:1.75;background:${bgColor};color:${textColor}}
h1{font-size:2em;font-weight:700;border-bottom:1px solid ${borderColor};padding-bottom:.3em}
h2{font-size:1.5em;font-weight:600;border-bottom:1px solid ${borderColor};padding-bottom:.25em}
h3{font-size:1.25em;font-weight:600}
strong{color:${strongColor}}
a{color:${linkColor};text-decoration:none}
code{background:${codeBg};color:${codeColor};padding:2px 6px;border-radius:3px;font-size:.875em;font-family:'SF Mono','Fira Code',Menlo,monospace}
pre{background:${codeBlockBg};color:${codeBlockText};padding:16px;border-radius:6px;overflow-x:auto;margin:1em 0}
pre code{background:none;padding:0;color:inherit}
blockquote{border-left:4px solid ${blockquoteBorder};background:${blockquoteBg};padding-left:16px;margin:1em 0;color:${textMuted}}
table{border-collapse:collapse;width:100%;margin:1em 0}
th,td{border:1px solid ${borderColor};padding:8px 12px}
th{background:${tableHeaderBg};font-weight:600}
hr{border:none;border-top:2px solid ${borderColor};margin:2em 0}
img{max-width:100%}
::selection{background:${selectionBg}}
</style>
</head><body>${getHTML()}</body></html>`
  api.exportHTML(html)
}

// ─── Search (Ctrl+F) ──────────────────────────────────────────────────────────

function initSearch(): void {
  const searchBar = document.getElementById('search-bar') as HTMLElement
  const searchInput = document.getElementById('search-input') as HTMLInputElement
  const searchCount = document.getElementById('search-count') as HTMLElement
  const prevBtn = document.getElementById('search-prev') as HTMLButtonElement
  const nextBtn = document.getElementById('search-next') as HTMLButtonElement
  const closeBtn = document.getElementById('search-close') as HTMLButtonElement

  function countMatches(text: string): number {
    if (!text) return 0
    const pm = document.querySelector('#editor .ProseMirror')
    if (!pm) return 0
    const content = pm.textContent || ''
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return (content.match(new RegExp(escaped, 'gi')) || []).length
  }

  function doSearch(backwards = false): void {
    const text = searchInput.value
    if (!text) return
    const found = window.find(text, false, backwards, true, false, false, true)
    const count = countMatches(text)
    searchCount.textContent = count > 0 ? `${count}` : '0'
  }

  function showSearch(): void {
    searchBar.classList.remove('hidden')
    searchInput.value = ''
    searchInput.placeholder = t('search.placeholder')
    searchCount.textContent = ''
    searchInput.focus()
    // Clear any previous find highlight
    window.getSelection()?.removeAllRanges()
  }

  function hideSearch(): void {
    searchBar.classList.add('hidden')
    window.getSelection()?.removeAllRanges()
  }

  document.addEventListener('keydown', (e) => {
    // Ctrl+F / Cmd+F — open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault()
      showSearch()
    }
    // Esc — close search bar, close panels
    if (e.key === 'Escape') {
      if (!searchBar.classList.contains('hidden')) {
        hideSearch()
        e.preventDefault()
      }
    }
  })

  searchInput.addEventListener('input', () => {
    doSearch()
  })

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      doSearch(e.shiftKey)
    }
  })

  prevBtn.addEventListener('click', () => doSearch(true))
  nextBtn.addEventListener('click', () => doSearch(false))
  closeBtn.addEventListener('click', () => hideSearch())
}

// ─── Bookmarks ───────────────────────────────────────────────────────────────

interface Bookmark { path: string; addedAt: number }
const BM_KEY = 'huasmd-bookmarks'

function loadBookmarks(): Bookmark[] {
  try { return JSON.parse(localStorage.getItem(BM_KEY) || '[]') }
  catch { return [] }
}

function saveBookmarks(bm: Bookmark[]): void {
  localStorage.setItem(BM_KEY, JSON.stringify(bm))
}

function toggleBookmark(filePath: string): boolean {
  const bm = loadBookmarks()
  const idx = bm.findIndex(b => b.path === filePath)
  if (idx >= 0) { bm.splice(idx, 1); saveBookmarks(bm); return false }
  bm.push({ path: filePath, addedAt: Date.now() })
  saveBookmarks(bm)
  return true
}

function isBookmarked(filePath: string): boolean {
  return loadBookmarks().some(b => b.path === filePath)
}

async function renderBookmarkPanel(): Promise<void> {
  const api = window.electronAPI
  const listEl = document.getElementById('bookmark-list')
  if (!listEl) return
  const bm = loadBookmarks()
  if (bm.length === 0) {
    listEl.innerHTML = `<div class="toc-empty">${t('bookmark.empty')}</div>`
    return
  }
  const items = await Promise.all(bm.map(async (b) => {
    const exists = await api.checkFileExists(b.path)
    const name = b.path.split(/[/\\]/).pop() || b.path
    return { ...b, name, exists }
  }))
  listEl.innerHTML = items.map((b, i) => `
    <div class="bookmark-item${b.exists ? '' : ' missing'}" data-idx="${i}">
      <span class="bm-icon">${b.exists ? '📄' : '⚠️'}</span>
      <div class="bm-info">
        <div class="bm-name">${b.name}</div>
        <div class="bm-path">${b.exists ? b.path : t('bookmark.missing') + ': ' + b.path}</div>
      </div>
      <button class="bm-remove" title="${t('bookmark.remove')}">✕</button>
    </div>
  `).join('')

  // Wire click handlers
  listEl.querySelectorAll<HTMLElement>('.bookmark-item').forEach((el) => {
    el.addEventListener('click', async (e) => {
      const idx = parseInt(el.dataset.idx || '')
      if (isNaN(idx)) return
      const b = items[idx]
      if (!b) return

      // If clicking remove button
      if ((e.target as HTMLElement).classList.contains('bm-remove')) {
        e.stopPropagation()
        const bm = loadBookmarks()
        bm.splice(idx, 1)
        saveBookmarks(bm)
        updateBookmarkBtn()
        renderBookmarkPanel()
        return
      }

      // If file exists, open it
      if (b.exists) {
        const result = await api.openFilePath(b.path)
        if (result) setContent(result.content)
        document.getElementById('bookmark-panel')?.classList.add('hidden')
        return
      }

      // File missing: confirm dialog with option to open folder
      const choice = confirm(`${t('bookmark.missing')}\n\n${b.path}\n\n[OK] ${t('bookmark.remove')}    [Cancel] ${t('bookmark.openFolder')}`)
      if (choice) {
        // Remove
        const bm = loadBookmarks()
        const fidx = bm.findIndex(x => x.path === b.path)
        if (fidx >= 0) { bm.splice(fidx, 1); saveBookmarks(bm) }
        updateBookmarkBtn()
        renderBookmarkPanel()
      }
    })
  })
}

function updateBookmarkBtn(): void {
  const btn = document.getElementById('bookmark-btn')
  // currentFilePath is tracked via last opened file — use a hidden data attr
  const path = btn?.dataset.currentPath || ''
  if (btn) btn.classList.toggle('bookmarked', isBookmarked(path))
}

function initBookmarks(): void {
  const btn = document.getElementById('bookmark-btn')
  const panel = document.getElementById('bookmark-panel')
  if (!btn || !panel) return

  const api = window.electronAPI

  api.onFileOpened((data) => {
    btn.dataset.currentPath = data.path
    updateBookmarkBtn()
  })

  btn.addEventListener('click', async () => {
    const path = btn.dataset.currentPath
    if (!path) return
    const active = toggleBookmark(path)
    btn.classList.toggle('bookmarked', active)
  })

  // Right-click to show bookmark list
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    const hidden = panel.classList.contains('hidden')
    closeAllPanels()
    if (hidden) {
      renderBookmarkPanel()
      panel.classList.remove('hidden')
    }
  })

  // Close panel on outside click
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (!t.closest('#bookmark-panel') && !t.closest('#bookmark-btn')) {
      panel.classList.add('hidden')
    }
  })
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  const api = window.electronAPI

  // Theme
  const savedTheme = loadSavedTheme()
  if (savedTheme.startsWith('custom:')) {
    const fileName = savedTheme.slice(7)
    const css = await api.loadThemeCSS(fileName)
    applyTheme(savedTheme, css || undefined)
  } else {
    applyTheme(savedTheme)
  }

  // i18n
  applyI18n()

  // Editor — pass onChange to keep TOC fresh
  await createEditor('editor', () => refreshTOC())

  // Width toggle
  initWidthToggle()

  // TOC
  initTOC()

  // Status bar
  initStatusbar()

  // Search
  initSearch()

  // Bookmarks
  initBookmarks()

  // Click outside to close any open panel/popover
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target.closest('#pop-panel') || target.closest('.sb-pop')) return
    if (target.closest('#toc-panel') || target.closest('#toc-btn')) return
    closeAllPanels()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllPanels()
  })

  // Slides button — open as slides
  slidesBtnEl().addEventListener('click', () => api.openAsSlides(getContent()))

  // Existing IPC handlers
  api.onMenuOpen(async () => {
    const result = await api.openFile()
    if (result) setContent(result.content)
  })
  api.onMenuSave(() => api.saveFile(getContent()))
  api.onMenuSaveAs(() => api.saveFileAs(getContent()))
  api.onMenuExportPDF(() => api.exportPDF())
  api.onMenuExportHTML(() => triggerExportHTML())

  api.onNewFile(() => { exitSourceMode(); setMarkdown(''); refreshTOC() })
  api.onFileOpened((data) => setContent(data.content))
  api.onFileChanged((content) => {
    if (sourceModeActive) {
      sourceEl().value = content
    } else {
      setMarkdown(content)
    }
  })
  api.onSetTheme((theme) => {
    applyTheme(theme)
    // Theme change may affect TOC colors, no rebuild needed
  })
  api.onSetCustomCSS((css) => {
    const theme = loadSavedTheme()
    applyTheme(theme, css)
  })

  api.onMenuNewSlides(async () => { await api.newSlides() })
  api.onNewSlidesContent((content) => { enterSourceMode(content) })
  api.onMenuOpenAsSlides(async () => { await api.openAsSlides(getContent()) })
  api.onMenuExportSlides(async () => { await api.exportSlides(getContent()) })
  api.onMenuImportTheme(async () => {
    const result = await api.loadCustomTheme()
    if (result) applyTheme(`custom:${result.name}`, result.css)
  })

  const agentIndicator = document.getElementById('agent-indicator')
  const agentDot = document.getElementById('agent-dot')
  const agentLabel = document.getElementById('agent-label')
  api.onAgentActivity((state) => {
    if (!agentDot || !agentLabel || !agentIndicator) return
    if (state === 'idle') {
      agentIndicator.className = 'hidden'
    } else if (state === 'active') {
      agentIndicator.className = 'show'
      agentDot.className = 'active'
      agentLabel.textContent = t('agent.writing')
    } else if (state === 'cooldown') {
      agentIndicator.className = 'show'
      agentDot.className = 'cooldown'
      agentLabel.textContent = t('agent.done')
    }
  })

  // Auto-update status
  const updateIndicator = document.getElementById('update-indicator')
  const updateText = document.getElementById('update-text')
  let updateReady = false
  api.onUpdateStatus((data) => {
    if (!updateIndicator || !updateText) return
    updateReady = false
    if (data.status === 'downloading') {
      updateIndicator.className = ''
      updateText.textContent = data.text || ''
      updateIndicator.style.cursor = 'default'
    } else if (data.status === 'ready') {
      updateReady = true
      updateIndicator.className = ''
      updateText.textContent = data.text || ''
      updateIndicator.title = t('update.install')
      updateIndicator.style.cursor = 'pointer'
    } else if (data.status === 'error' || data.status === 'dismissed') {
      updateIndicator.className = 'hidden'
    }
  })
  if (updateIndicator) {
    updateIndicator.addEventListener('click', () => {
      if (updateReady) api.installUpdate()
    })
    updateIndicator.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      api.dismissUpdate()
    })
    updateIndicator.title = t('update.install') + ' | ' + t('update.dismissHint')
  }

  // Drag & drop file open
  document.addEventListener('dragover', (e) => e.preventDefault())
  document.addEventListener('drop', async (e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files[0]
    if (!file) return
    const filePath = api.getPathForFile(file)
    if (!filePath) return
    const result = await api.openFilePath(filePath)
    if (result) setContent(result.content)
  })

  // Initial TOC build (after editor mounts)
  refreshTOC()
}

init().catch((e) => console.error('huasMD init failed:', e))
