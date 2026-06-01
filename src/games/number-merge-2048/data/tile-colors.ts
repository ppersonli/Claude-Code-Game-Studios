/**
 * Tile color mapping by value for Number Merge 2048.
 * Kawaii/cute style with bright gradients.
 */
export interface TileStyle {
  bg: string
  color: string
  glow?: string
  fontSize: string
}

const TILE_STYLES: Record<number, TileStyle> = {
  2:    { bg: 'linear-gradient(135deg, #FFB6C1, #FF69B4)', color: '#fff', fontSize: '2rem' },
  4:    { bg: 'linear-gradient(135deg, #87CEEB, #4FC3F7)', color: '#fff', fontSize: '2rem' },
  8:    { bg: 'linear-gradient(135deg, #90EE90, #4CAF50)', color: '#fff', fontSize: '2rem' },
  16:   { bg: 'linear-gradient(135deg, #FFD700, #FFC107)', color: '#fff', fontSize: '2rem' },
  32:   { bg: 'linear-gradient(135deg, #FFA726, #FF9800)', color: '#fff', fontSize: '2rem' },
  64:   { bg: 'linear-gradient(135deg, #FF5722, #F44336)', color: '#fff', fontSize: '2rem' },
  128:  { bg: 'linear-gradient(135deg, #BA68C8, #9C27B0)', color: '#fff', glow: '0 0 12px #CE93D8', fontSize: '1.8rem' },
  256:  { bg: 'linear-gradient(135deg, #AB47BC, #8E24AA)', color: '#fff', glow: '0 0 14px #BA68C8', fontSize: '1.8rem' },
  512:  { bg: 'linear-gradient(135deg, #9C27B0, #7B1FA2)', color: '#fff', glow: '0 0 16px #AB47BC', fontSize: '1.8rem' },
  1024: { bg: 'linear-gradient(135deg, #7C4DFF, #651FFF)', color: '#fff', glow: '0 0 18px #B388FF', fontSize: '1.5rem' },
  2048: { bg: 'linear-gradient(135deg, #FFD700, #FF6F00)', color: '#fff', glow: '0 0 24px #FFD700', fontSize: '1.5rem' },
}

const DEFAULT_STYLE: TileStyle = {
  bg: 'linear-gradient(135deg, #FFD700, #FF6F00)',
  color: '#fff',
  glow: '0 0 24px #FFD700',
  fontSize: '1.3rem',
}

export function getTileStyle(value: number): TileStyle {
  return TILE_STYLES[value] ?? DEFAULT_STYLE
}
