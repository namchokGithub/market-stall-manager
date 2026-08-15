import { useCallback, useState } from 'react'
import type { Stall } from '../types/stall'

interface MapHistoryState {
  past: Stall[][]
  present: Stall[]
  future: Stall[][]
}

export interface UseMapHistoryResult {
  present: Stall[]
  canUndo: boolean
  canRedo: boolean
  commit: (next: Stall[]) => void
  undo: () => void
  redo: () => void
  reset: (next: Stall[]) => void
}

export function useMapHistory(initial: Stall[]): UseMapHistoryResult {
  const [state, setState] = useState<MapHistoryState>({
    past: [],
    present: initial,
    future: [],
  })

  const commit = useCallback((next: Stall[]) => {
    setState((prev) => ({ past: [...prev.past, prev.present], present: next, future: [] }))
  }, [])

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev
      const previous = prev.past[prev.past.length - 1]
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev
      const next = prev.future[0]
      return { past: [...prev.past, prev.present], present: next, future: prev.future.slice(1) }
    })
  }, [])

  const reset = useCallback((next: Stall[]) => {
    setState({ past: [], present: next, future: [] })
  }, [])

  return {
    present: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    commit,
    undo,
    redo,
    reset,
  }
}
