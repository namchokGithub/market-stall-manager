import { useCallback, useState } from 'react'

interface MapHistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export interface UseMapHistoryResult<T> {
  present: T
  canUndo: boolean
  canRedo: boolean
  commit: (next: T) => void
  undo: () => void
  redo: () => void
  reset: (next: T) => void
}

export function useMapHistory<T>(initial: T): UseMapHistoryResult<T> {
  const [state, setState] = useState<MapHistoryState<T>>({
    past: [],
    present: initial,
    future: [],
  })

  const commit = useCallback((next: T) => {
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

  const reset = useCallback((next: T) => {
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
