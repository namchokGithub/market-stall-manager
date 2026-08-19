import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, Loader2, QrCode, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { publicMarketShareUrl, publishPublicMarketShare } from '../../data/publicMarketShares'
import type { MapState } from '../../types/marketState'

interface ShareMarketDialogProps {
  state: MapState
  open: boolean
  onOpenChange: (open: boolean) => void
}

async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value)
}

export function ShareMarketDialog({ state, open, onOpenChange }: ShareMarketDialogProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    setError(null)
    try {
      const shareId = await publishPublicMarketShare(state)
      setShareUrl(publicMarketShareUrl(shareId))
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Unable to publish the market map.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await copyToClipboard(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2_000)
    } catch {
      setError('Unable to copy the link. Please copy it from the field below.')
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShareUrl(null)
      setError(null)
      setCopied(false)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" />Share market map</DialogTitle>
          <DialogDescription>
            This creates a public, layout-only snapshot. It does not show booking or renter details.
          </DialogDescription>
        </DialogHeader>

        {shareUrl ? (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg border bg-white p-3">
              <QRCodeSVG value={shareUrl} size={192} level="M" includeMargin />
            </div>
            <div className="flex w-full gap-2">
              <input aria-label="Public market map link" readOnly value={shareUrl} className="min-w-0 flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copy public link">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
            A QR code and shareable link will be generated from the current saved market layout.
          </div>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Close</Button>
          {!shareUrl && <Button type="button" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
            {isPublishing ? 'Publishing…' : 'Create public link'}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
