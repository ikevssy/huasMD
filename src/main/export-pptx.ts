import PptxGenJS from 'pptxgenjs'
import { join, extname } from 'path'
import { readFileSync } from 'fs'

interface SlideMeta {
  kicker?: string
  chip?: string
  page?: string
}

interface ParsedSlide {
  type: string
  title: string
  blocks: (string | { type: 'image'; alt: string; src: string })[]
  bg?: string
  src?: string
}

function parseFrontmatter(text: string): { meta: SlideMeta; body: string } {
  const meta: SlideMeta = {}
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { meta, body: text }
  match[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':')
    if (k && v.length) meta[k.trim() as keyof SlideMeta] = v.join(':').trim()
  })
  return { meta, body: match[2] }
}

function parseDirective(line: string): Record<string, string> {
  const match = line.match(/<!--\s*(.*?)\s*-->/)
  if (!match) return {}
  const result: Record<string, string> = {}
  match[1].split(',').forEach(pair => {
    const [k, ...v] = pair.split(':')
    if (k) result[k.trim()] = v.join(':').trim()
  })
  return result
}

function parseSlides(body: string): ParsedSlide[] {
  return body.split(/\n---\n/).map(raw => {
    const lines = raw.trim().split('\n')
    const slide: ParsedSlide = { type: 'section', title: '', blocks: [] }

    const firstLine = (lines[0] || '').trim()
    if (firstLine.startsWith('<!--') && firstLine.endsWith('-->')) {
      const dir = parseDirective(firstLine)
      if (dir.type) slide.type = dir.type
      if (dir.bg) slide.bg = dir.bg
      if (dir.src) slide.src = dir.src
      lines.shift()
    }

    lines.forEach(line => {
      if (line.startsWith('# ')) {
        slide.title = line.slice(2).trim()
        if (slide.type === 'section') slide.type = 'cover'
      } else if (line.startsWith('## ')) {
        slide.title = line.slice(3).trim()
      } else if (line.trim()) {
        const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
        if (imgMatch) {
          slide.blocks.push({ type: 'image', alt: imgMatch[1], src: imgMatch[2] })
        } else {
          slide.blocks.push(line.trim())
        }
      }
    })

    return slide
  }).filter(s => s.type || s.title || s.blocks.length)
}

const COLOR = {
  orange: 'F1752D',
  dark: '2c2c2c',
  white: 'FFFFFF',
  gray: '888888',
  light: 'f5f5f5',
  accent: 'F1752D',
}

export async function buildPPTX(content: string, srcDir: string): Promise<ArrayBuffer> {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const { meta, body } = parseFrontmatter(normalized)
  const slides = parseSlides(body)

  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'SLIDE', width: '13.333', height: '7.5' })
  pptx.layout = 'SLIDE'

  // Helper: embed local image as base64
  function getImageDataUrl(imgSrc: string): string | null {
    try {
      const abs = join(srcDir, imgSrc)
      const buf = readFileSync(abs)
      const ext = extname(imgSrc).slice(1).toLowerCase()
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
        : ext === 'png' ? 'image/png'
        : ext === 'gif' ? 'image/gif'
        : ext === 'webp' ? 'image/webp'
        : ext === 'svg' ? 'image/svg+xml'
        : 'image/png'
      return `data:${mime};base64,${buf.toString('base64')}`
    } catch { return null }
  }

  slides.forEach((slide, idx) => {
    const s = pptx.addSlide()

    // Background
    if (slide.bg) {
      const dataUrl = getImageDataUrl(slide.bg)
      if (dataUrl) {
        s.background = { data: dataUrl }
      }
    } else if (slide.type === 'cover' && !slide.bg) {
      s.background = { fill: COLOR.white }
    } else if (slide.type === 'statement') {
      s.background = { fill: COLOR.orange }
    } else {
      s.background = { fill: COLOR.white }
    }

    // Axis bar (left strip for non-cover slides)
    if (slide.type !== 'cover') {
      s.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: 0.35, h: '100%',
        fill: { color: COLOR.orange }
      })
    }

    // Kicker + Chip (header area)
    const hasMeta = meta.kicker || meta.chip || meta.page
    if (hasMeta && slide.type !== 'cover' && slide.type !== 'thankyou') {
      const hdr: { text: string; options: any }[] = []
      if (meta.kicker) hdr.push({ text: meta.kicker, options: { fontSize: 11, color: COLOR.orange, bold: true, fontFace: 'Arial' } })
      if (meta.chip) hdr.push({ text: meta.chip, options: { fontSize: 11, color: COLOR.gray, fontFace: 'Arial' } })
      s.addText(hdr, { x: 0.6, y: 0.25, w: 11.5, h: 0.4 })
    }

    // Title
    const titleColor = slide.type === 'statement' ? COLOR.white : COLOR.dark
    const titleSize = slide.type === 'cover' ? 36 : (slide.type === 'statement' ? 30 : 24)
    const titleX = slide.type === 'cover' || slide.type === 'statement' ? 1.0 : 0.7
    const titleY = slide.type === 'cover' ? 2.5 : (hasMeta && slide.type !== 'thankyou' ? 1.1 : 1.8)

    if (slide.title) {
      s.addText(slide.title, {
        x: titleX, y: titleY, w: 11.3, h: slide.type === 'cover' ? 2.0 : 1.0,
        fontSize: titleSize,
        color: titleColor,
        bold: true,
        fontFace: 'Arial',
        align: slide.type === 'cover' || slide.type === 'statement' ? 'center' : 'left',
        valign: 'middle'
      })
    }

    // Content blocks
    const contentBlocks = slide.blocks.filter(b => typeof b === 'string')
    const imageBlocks = slide.blocks.filter(b => typeof b !== 'string') as { type: 'image'; src: string; alt: string }[]

    if (contentBlocks.length > 0 && slide.type !== 'cover') {
      const textY = slide.title ? titleY + 1.2 : titleY
      const text = contentBlocks.map(b => ({
        text: b as string,
        options: {
          fontSize: slide.type === 'statement' ? 16 : 14,
          color: slide.type === 'statement' ? COLOR.white : COLOR.dark,
          fontFace: 'Arial',
          paraSpaceAfter: 6
        }
      }))
      s.addText(text, {
        x: 0.7, y: textY, w: 11.5, h: 4.5,
        align: slide.type === 'statement' ? 'center' : 'left',
        valign: 'top'
      })
    }

    // Images (one per slide, positioned below content)
    imageBlocks.forEach((img, i) => {
      const dataUrl = getImageDataUrl(img.src)
      if (dataUrl) {
        const imgY = slide.title ? titleY + 2.0 : titleY
        s.addImage({
          data: dataUrl,
          x: slide.type === 'cover' ? 3.5 : 1.5,
          y: imgY + i * 3.0,
          w: slide.type === 'cover' ? 6.0 : 10.0,
          h: slide.type === 'cover' ? 3.0 : 4.5,
          sizing: { type: 'contain', w: slide.type === 'cover' ? 6.0 : 10.0, h: slide.type === 'cover' ? 3.0 : 4.5 }
        })
      }
    })

    // Video slides: show placeholder text
    if (slide.type === 'video' && slide.src) {
      s.addText(`📹 ${slide.src}`, {
        x: 1.0, y: 3.0, w: 11.0, h: 1.5,
        fontSize: 18, color: COLOR.gray, align: 'center', fontFace: 'Arial'
      })
    }

    // Footer
    if ((meta.chip || meta.page) && slide.type !== 'cover' && slide.type !== 'thankyou') {
      const ftr: { text: string; options: any }[] = []
      if (meta.chip) ftr.push({ text: meta.chip, options: { fontSize: 9, color: COLOR.gray, fontFace: 'Arial' } })
      if (meta.page) ftr.push({ text: `  ${meta.page}`, options: { fontSize: 9, color: COLOR.gray, fontFace: 'Arial' } })
      s.addText(ftr, { x: 0.6, y: 6.9, w: 11.5, h: 0.35 })
    }

    // Slide number
    if (slide.type !== 'cover') {
      s.addText(`${idx + 1}`, {
        x: 12.2, y: 6.9, w: 0.6, h: 0.35,
        fontSize: 9, color: COLOR.gray, align: 'right', fontFace: 'Arial'
      })
    }
  })

  return pptx.write({ outputType: 'arraybuffer' }) as Promise<ArrayBuffer>
}
