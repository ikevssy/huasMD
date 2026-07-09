export type Lang = 'zh' | 'en'

type Dict = Record<string, string>

const dict: Record<Lang, Dict> = {
  zh: {
    // Status bar — direct actions
    'action.new': '新建',
    'action.open': '打开',
    'action.save': '保存',
    // Status bar — popover buttons
    'panel.theme': '主题',
    'panel.language': '语言',
    'panel.export': '导出',
    // Built-in themes
    'theme.light': '明亮',
    'theme.dark': '暗黑',
    'theme.elegant': '典雅',
    'theme.elegant_warm': '典雅暖色',
    'theme.newsprint': '报纸',
    'theme.sepia': '羊皮纸',
    'theme.solarized_light': '太阳光',
    'theme.github_light': 'GitHub 明亮',
    'theme.material_light': 'Material 明亮',
    'theme.material_ocean': 'Material 海洋',
    'theme.ayu': '暮光',
    'theme.gandalf': '灰羽',
    'theme.duotone_heat': '暖樱',
    // Theme panel
    'theme.import': '导入主题…',
    'theme.custom': '自定义',
    // Language panel
    'lang.zh': '中文',
    'lang.en': 'English',
    // Export panel
    'export.pdf': '导出 PDF…',
    'export.html': '导出 HTML…',
    'export.pptx': '导出 PPTX…',
    'export.slides_html': '导出 HTML 幻灯片…',
    'export.open_as_slides': '作为幻灯片打开',
    // Titlebar icons
    'slides.open': '作为幻灯片打开',
    'toc.title': '目录',
    'toc.empty': '暂无标题',
    'width.toggle': '切换全宽',
    'search.placeholder': '查找...',
    'agent.writing': 'AI 正在写入…',
    'agent.done': '写入完成',
    'update.install': '点击安装更新',
    'update.dismissHint': '右键关闭提示',
    'update.upToDate': '已是最新版本',
    // Misc
    'app.name': 'huasMD'
  },
  en: {
    'action.new': 'New',
    'action.open': 'Open',
    'action.save': 'Save',
    'panel.theme': 'Theme',
    'panel.language': 'Language',
    'panel.export': 'Export',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.elegant': 'Elegant',
    'theme.elegant_warm': 'Elegant Warm',
    'theme.newsprint': 'Newsprint',
    'theme.sepia': 'Sepia',
    'theme.solarized_light': 'Solarized Light',
    'theme.github_light': 'GitHub Light',
    'theme.material_light': 'Material Light',
    'theme.material_ocean': 'Material Ocean',
    'theme.ayu': 'Ayu Light',
    'theme.gandalf': 'Gandalf',
    'theme.duotone_heat': 'Rose Duotone',
    'theme.import': 'Import Theme…',
    'theme.custom': 'Custom',
    'lang.zh': '中文',
    'lang.en': 'English',
    'export.pdf': 'Export PDF…',
    'export.html': 'Export HTML…',
    'export.slides': 'Export HTML Slides…',
    'export.pptx': 'Export PPTX…',
    'export.slides_html': 'Export HTML Slides…',
    'export.open_as_slides': 'Open as Slides',
    'slides.open': 'Open as Slides',
    'toc.title': 'Outline',
    'toc.empty': 'No headings yet',
    'width.toggle': 'Toggle full width',
    'search.placeholder': 'Find...',
    'agent.writing': 'AI Writing…',
    'agent.done': 'Write Complete',
    'update.install': 'Click to install update',
    'update.upToDate': 'Already up to date',
    'app.name': 'huasMD'
  }
}

const STORAGE_KEY = 'huasmd-lang'

let currentLang: Lang = detectLang()

function detectLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function t(key: string): string {
  return dict[currentLang][key] ?? dict.en[key] ?? key
}

export function getLang(): Lang {
  return currentLang
}

export function setLang(lang: Lang): void {
  currentLang = lang
  localStorage.setItem(STORAGE_KEY, lang)
}
