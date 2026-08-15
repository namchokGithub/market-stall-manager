import type { Stall } from '../types/stall'

export const ROW_CAPACITY = 6

const STALL_WIDTH = 120
const STALL_HEIGHT = 100
const GAP_X = 20
const GAP_Y = 80
const ORIGIN_X = 40
const ORIGIN_Y = 40

function buildRow(prefix: string, rowIndex: number): Stall[] {
  return Array.from({ length: ROW_CAPACITY }, (_, i) => {
    const code = `${prefix}${String(i + 1).padStart(2, '0')}`
    return {
      id: code.toLowerCase(),
      code,
      x: ORIGIN_X + i * (STALL_WIDTH + GAP_X),
      y: ORIGIN_Y + rowIndex * (STALL_HEIGHT + GAP_Y),
      width: STALL_WIDTH,
      height: STALL_HEIGHT,
    }
  })
}

export const mockStalls: Stall[] = [
  ...buildRow('A', 0),
  ...buildRow('B', 1),
  ...buildRow('C', 2),
]

export function nextStallCode(stalls: Stall[], rowCapacity: number = ROW_CAPACITY): string {
  if (stalls.length === 0) return 'A01'
  const prefixes = stalls.map((s) => s.code.charAt(0))
  const lastPrefix = [...prefixes].sort().at(-1) as string
  const numbersInPrefix = stalls
    .filter((s) => s.code.charAt(0) === lastPrefix)
    .map((s) => parseInt(s.code.slice(1), 10))
  const maxNumber = Math.max(...numbersInPrefix)
  if (maxNumber >= rowCapacity) {
    const nextPrefix = String.fromCharCode(lastPrefix.charCodeAt(0) + 1)
    return `${nextPrefix}01`
  }
  return `${lastPrefix}${String(maxNumber + 1).padStart(2, '0')}`
}
