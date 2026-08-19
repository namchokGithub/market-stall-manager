import { todayIso } from './dates'
import type { MarketLayout } from '../types/market'

export type MapExportFormat = 'png' | 'jpeg' | 'pdf'

const MAX_EXPORT_EDGE = 4096
const DEFAULT_PIXEL_RATIO = 2

export class MapExportError extends Error {}

export function exportPixelRatio(market: MarketLayout): number {
  return Math.min(DEFAULT_PIXEL_RATIO, MAX_EXPORT_EDGE / Math.max(market.width, market.height))
}

function filename(format: MapExportFormat): string {
  const extension = format === 'jpeg' ? 'jpg' : format
  return `market-map-${todayIso()}.${extension}`
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function downloadImage(dataUrl: string, format: 'png' | 'jpeg'): void {
  downloadDataUrl(dataUrl, filename(format))
}

export async function downloadPdf(dataUrl: string, market: MarketLayout): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()
  const margin = 12
  const imageTop = 27
  const maxWidth = pageWidth - margin * 2
  const maxHeight = pageHeight - imageTop - margin
  const scale = Math.min(maxWidth / market.width, maxHeight / market.height)
  const imageWidth = market.width * scale
  const imageHeight = market.height * scale

  document.setFontSize(16)
  document.text('Market Map', margin, 13)
  document.setFontSize(9)
  document.text(`Exported ${todayIso()}`, margin, 20)
  document.addImage(dataUrl, 'JPEG', (pageWidth - imageWidth) / 2, imageTop, imageWidth, imageHeight)
  document.save(filename('pdf'))
}
