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
    localStorage.setItem('colamd-width', wide ? 'wide' : 'narrow')
  })
}

// ─── TOC outline ──────────────────────────────────────────────────────────────

interface TocEntry { level: number; text: string; el: Element }

function buildTOC(): TocEntry[] {
  const headings = document.querySelectorAll('#editor .ProseMirror h1, h2, h3, h4, h5, h6')
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
      closeAllPanels()
      // Re-render to update check marks
      setTimeout(() => { openPopover('theme') }, 0)
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
    <div class="pop-item" data-export="pdf"><span>${t('export.pdf')}</span></div>
    <div class="pop-item" data-export="html"><span>${t('export.html')}</span></div>
    <div class="pop-item" data-export="slides"><span>${t('export.slides')}</span></div>
    <div class="pop-item" data-export="open-as-slides"><span>${t('export.open_as_slides')}</span></div>
  `
  popPanelEl().querySelectorAll<HTMLElement>('[data-export]').forEach(el => {
    el.addEventListener('click', () => {
      const action = el.dataset.export
      closeAllPanels()
      if (action === 'pdf') api.exportPDF()
      else if (action === 'html') triggerExportHTML()
      else if (action === 'slides') api.exportSlides(getContent())
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

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  const api = window.electronAPI

  // Theme
  const savedTheme = loadSavedTheme()
  applyTheme(savedTheme)
  if (savedTheme.startsWith('custom:')) {
    const fileName = savedTheme.slice(7)
    const css = await api.loadThemeCSS(fileName)
    if (css) applyTheme(savedTheme, css)
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

  const agentDot = document.getElementById('agent-dot')
  api.onAgentActivity((state) => {
    if (agentDot) agentDot.className = state === 'idle' ? '' : state
  })

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

init().catch((e) => console.error('ColaMD init failed:', e))
