// Built-in theme name -> body CSS class. Order matters for menu display.
const themes: Record<string, string> = {
  light: 'theme-light',
  dark: 'theme-dark',
  elegant: 'theme-elegant',
  newsprint: 'theme-newsprint',
  sepia: 'theme-sepia',
  solarized_light: 'theme-solarized_light',
  github_light: 'theme-github_light',
  material_light: 'theme-material_light',
  material_ocean: 'theme-material_ocean'
}

// Ordered list of built-in theme keys (for rendering in panels)
export const builtinThemeKeys = [
  'light', 'dark', 'elegant', 'newsprint',
  'sepia', 'solarized_light', 'github_light',
  'material_light', 'material_ocean'
]

let customStyleEl: HTMLStyleElement | null = null

export function applyTheme(name: string, customCSS?: string): void {
  const body = document.body

  // Remove all theme classes
  Object.values(themes).forEach(cls => body.classList.remove(cls))
  body.classList.remove('theme-custom')

  // Remove custom theme style
  if (customStyleEl) {
    customStyleEl.remove()
    customStyleEl = null
  }

  if (customCSS || name.startsWith('custom:')) {
    if (customCSS) {
      customStyleEl = document.createElement('style')
      customStyleEl.textContent = customCSS
      document.head.appendChild(customStyleEl)
    }
    body.classList.add('theme-custom')
  } else if (themes[name]) {
    body.classList.add(themes[name])
  }

  // Persist theme choice
  localStorage.setItem('huasmd-theme', name)
}

export function loadSavedTheme(): string {
  return localStorage.getItem('huasmd-theme') || 'elegant'
}

export function getCurrentThemeClass(): string | null {
  const body = document.body
  for (const cls of Object.values(themes)) {
    if (body.classList.contains(cls)) return cls
  }
  return body.classList.contains('theme-custom') ? 'theme-custom' : null
}
