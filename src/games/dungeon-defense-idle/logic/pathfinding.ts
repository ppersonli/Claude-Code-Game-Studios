/** Simple pathfinding — predefined waypoints for monsters to follow */

export interface Point { x: number; y: number }

/** Default dungeon path: a winding S-shape through the grid */
export const DEFAULT_WAYPOINTS: Point[] = [
  { x: 0, y: 3 },
  { x: 3, y: 3 },
  { x: 3, y: 1 },
  { x: 7, y: 1 },
  { x: 7, y: 5 },
  { x: 2, y: 5 },
  { x: 2, y: 7 },
  { x: 9, y: 7 },
]

/** Convert grid waypoints to pixel positions */
export function waypointsToPixels(waypoints: Point[], cellSize: number, offsetX: number, offsetY: number): Point[] {
  return waypoints.map(w => ({
    x: offsetX + w.x * cellSize + cellSize / 2,
    y: offsetY + w.y * cellSize + cellSize / 2,
  }))
}

/** Get grid cells that the path passes through */
export function getPathCells(waypoints: Point[]): Set<string> {
  const cells = new Set<string>()
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i]
    const b = waypoints[i + 1]
    // Walk from a to b (horizontal or vertical segments)
    if (a.x === b.x) {
      const minY = Math.min(a.y, b.y)
      const maxY = Math.max(a.y, b.y)
      for (let y = minY; y <= maxY; y++) cells.add(`${a.x},${y}`)
    } else {
      const minX = Math.min(a.x, b.x)
      const maxX = Math.max(a.x, b.x)
      for (let x = minX; x <= maxX; x++) cells.add(`${x},${a.y}`)
    }
  }
  return cells
}

/** Calculate total path length in pixels */
export function calcPathLength(pixelWaypoints: Point[]): number {
  let total = 0
  for (let i = 0; i < pixelWaypoints.length - 1; i++) {
    const dx = pixelWaypoints[i + 1].x - pixelWaypoints[i].x
    const dy = pixelWaypoints[i + 1].y - pixelWaypoints[i].y
    total += Math.sqrt(dx * dx + dy * dy)
  }
  return total
}

/** Move a monster along the path. Returns new position and whether it reached the end. */
export function moveAlongPath(
  currentPos: Point,
  targetIdx: number,
  pixelWaypoints: Point[],
  speed: number,       // pixels per second
  delta: number,       // seconds
): { pos: Point; waypointIdx: number; reachedEnd: boolean } {
  let remaining = speed * delta
  let pos = { ...currentPos }
  let idx = targetIdx

  while (remaining > 0 && idx < pixelWaypoints.length) {
    const target = pixelWaypoints[idx]
    const dx = target.x - pos.x
    const dy = target.y - pos.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist <= remaining) {
      pos = { x: target.x, y: target.y }
      remaining -= dist
      idx++
    } else {
      const ratio = remaining / dist
      pos = { x: pos.x + dx * ratio, y: pos.y + dy * ratio }
      remaining = 0
    }
  }

  return {
    pos,
    waypointIdx: idx,
    reachedEnd: idx >= pixelWaypoints.length,
  }
}
