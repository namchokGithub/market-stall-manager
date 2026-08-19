import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import Konva from 'konva'
import type { DisplayStall } from '../../types/stall'
import type { MarketLayout } from '../../types/market'
import { downloadImage, downloadPdf, exportPixelRatio, MapExportError, type MapExportFormat } from '../../lib/mapExport'
import { MarketScene } from './MarketScene'

export type { MapExportFormat } from '../../lib/mapExport'

export interface MapExportHandle {
  exportMap: (format: MapExportFormat) => Promise<void>
}

interface MapExportRendererProps {
  market: MarketLayout
  stalls: DisplayStall[]
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

export const MapExportRenderer = forwardRef<MapExportHandle, MapExportRendererProps>(function MapExportRenderer(
  { market, stalls },
  ref,
) {
  const stageRef = useRef<Konva.Stage>(null)
  const imagePromiseRef = useRef<Promise<HTMLImageElement | null>>(Promise.resolve(null))
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const url = market.backgroundImageUrl
    if (!url) {
      setBackgroundImage(null)
      imagePromiseRef.current = Promise.resolve(null)
      return
    }

    let active = true
    imagePromiseRef.current = new Promise((resolve, reject) => {
      const image = new window.Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        if (active) setBackgroundImage(image)
        resolve(image)
      }
      image.onerror = () => reject(new MapExportError('The background image does not allow export. Use a CORS-enabled image URL or remove it temporarily.'))
      image.src = url
    })
    imagePromiseRef.current.catch(() => {
      if (active) setBackgroundImage(null)
    })

    return () => {
      active = false
    }
  }, [market.backgroundImageUrl])

  useImperativeHandle(ref, () => ({
    exportMap: async (format) => {
      await imagePromiseRef.current
      await nextFrame()

      const stage = stageRef.current
      if (!stage) throw new MapExportError('The market map is not ready to export yet.')

      const pixelRatio = exportPixelRatio(market)
      try {
        if (format === 'pdf') {
          const dataUrl = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.92, pixelRatio })
          await downloadPdf(dataUrl, market)
          return
        }

        const dataUrl = stage.toDataURL({
          mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
          quality: format === 'jpeg' ? 0.92 : undefined,
          pixelRatio,
        })
        downloadImage(dataUrl, format)
      } catch (error) {
        if (error instanceof MapExportError) throw error
        throw new MapExportError('Unable to export this map. If it uses a background image, make sure the image URL allows CORS export.')
      }
    },
  }), [market, stalls])

  return (
    <div className="pointer-events-none fixed left-[-10000px] top-0" aria-hidden="true">
      <Stage ref={stageRef} width={market.width} height={market.height}>
        <Layer>
          <MarketScene market={market} stalls={stalls} backgroundImage={backgroundImage} />
        </Layer>
      </Stage>
    </div>
  )
})
