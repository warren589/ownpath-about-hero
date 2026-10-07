import type { ConnectorDef, Discipline, LayoutConfig, Point } from './config'

/** Resolved pixel geometry for one stage size. */
export type StageGeometry = {
  width: number
  height: number
  unit: number
  tile: number
  /** Icon edge length inside a tile — the node's base (scale 1) size. */
  icon: number
  center: Point
  start: Record<Discipline, Point>
  converge: Record<Discipline, Point>
  connectors: { def: ConnectorDef; d: string }[]
}

export function resolveGeometry(layout: LayoutConfig, width: number, height: number): StageGeometry {
  const unit = layout.unit(width, height)
  const center = { x: layout.systemCenter.x * width, y: layout.systemCenter.y * height }
  const tile = layout.tileSize * unit

  const start = {} as Record<Discipline, Point>
  const converge = {} as Record<Discipline, Point>
  for (const id of Object.keys(layout.iconStartPositions) as Discipline[]) {
    const s = layout.iconStartPositions[id]
    const c = layout.iconConvergePositions[id]
    start[id] = { x: s.x * width, y: s.y * height }
    converge[id] = { x: center.x + c.x * unit, y: center.y + c.y * unit }
  }

  const connectors = layout.connectorPaths.map((def) => ({
    def,
    d: connectorPath(def, converge[def.from], converge[def.to], layout.axis, layout.connectorRadius * unit),
  }))

  return { width, height, unit, tile, icon: tile * layout.iconInTile, center, start, converge, connectors }
}

/**
 * Paths run centre-to-centre; the node tiles sit above them, so every
 * connector appears to grow out of one node and into the next.
 */
function connectorPath(def: ConnectorDef, a: Point, b: Point, axis: 'x' | 'y', radius: number): string {
  if (def.route === 'straight' || a.x === b.x || a.y === b.y) return `M${a.x},${a.y} L${b.x},${b.y}`
  const t = def.stepAt ?? 0.5
  const points: Point[] =
    axis === 'x'
      ? [a, { x: a.x + (b.x - a.x) * t, y: a.y }, { x: a.x + (b.x - a.x) * t, y: b.y }, b]
      : [a, { x: a.x, y: a.y + (b.y - a.y) * t }, { x: b.x, y: a.y + (b.y - a.y) * t }, b]
  return roundedPolyline(points, radius)
}

/** Orthogonal polyline with circular-arc corners (radius clamped to fit each segment). */
export function roundedPolyline(points: Point[], radius: number): string {
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]
    const inLen = Math.hypot(curr.x - prev.x, curr.y - prev.y)
    const outLen = Math.hypot(next.x - curr.x, next.y - curr.y)
    const r = Math.min(radius, inLen / 2, outLen / 2)
    const p1 = { x: curr.x - ((curr.x - prev.x) / inLen) * r, y: curr.y - ((curr.y - prev.y) / inLen) * r }
    const p2 = { x: curr.x + ((next.x - curr.x) / outLen) * r, y: curr.y + ((next.y - curr.y) / outLen) * r }
    const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x)
    d += ` L${p1.x},${p1.y} A${r},${r} 0 0 ${cross > 0 ? 1 : 0} ${p2.x},${p2.y}`
  }
  const last = points[points.length - 1]
  return `${d} L${last.x},${last.y}`
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpPoint = (a: Point, b: Point, t: number): Point => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) })
