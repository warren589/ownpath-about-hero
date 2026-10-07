import type { CSSProperties } from 'react'
import { roundedPolyline } from '../AboutHero/geometry'
import { GRAPHIC, type Graphic } from './content'

const { cols, rows, cell } = GRAPHIC
const W = cols * cell
const H = rows * cell

/** Bar weight matches the hero connectors' proportion to their nodes. */
export const BAR_WIDTH = 0.34 // cells
const CORNER = 0.35 // cells
const TILE_RADIUS = 0.24 // of node edge, as in the hero

const px = (v: number) => v * cell

function gridPath() {
  let d = ''
  for (let x = 0; x <= cols; x++) d += `M${px(x)},0V${H}`
  for (let y = 0; y <= rows; y++) d += `M0,${px(y)}H${W}`
  return d
}
const GRID = gridPath()

type Vars = CSSProperties & Record<`--${string}`, string | number>

export function ApproachGraphic({ graphic }: { graphic: Graphic }) {
  return (
    <svg className="ap-graphic" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <path className="ap-graphic__grid" d={GRID} />

      {graphic.paths.map((p) => (
        <path
          key={p.id}
          className={`ap-graphic__path ap-graphic__path--${p.weight}`}
          d={roundedPolyline(
            p.points.map(([x, y]) => ({ x: px(x), y: px(y) })),
            px(CORNER),
          )}
          pathLength={1}
          strokeWidth={p.weight === 'bar' ? px(BAR_WIDTH) : undefined}
          style={{ '--rest': p.draw[0], '--active': p.draw[1] } as Vars}
        />
      ))}

      {graphic.nodes.map((n) => {
        const s = px(n.size)
        const classes = [
          'ap-graphic__node',
          `ap-graphic__node--${n.tone}`,
          n.outline && 'ap-graphic__node--outline',
          n.entry && 'ap-graphic__node--entry',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <g key={n.id} transform={`translate(${px(n.at[0])} ${px(n.at[1])})`}>
            <g className="ap-graphic__reveal">
              <rect
                className={classes}
                x={-s / 2}
                y={-s / 2}
                width={s}
                height={s}
                rx={s * TILE_RADIUS}
                style={
                  {
                    '--dx': `${px(n.shift?.[0] ?? 0)}px`,
                    '--dy': `${px(n.shift?.[1] ?? 0)}px`,
                    '--scale': n.activeScale ?? 1,
                  } as Vars
                }
              />
            </g>
          </g>
        )
      })}
    </svg>
  )
}

/** Maps a cell coordinate to page pixels for a rendered graphic. */
export function cellToClient(svg: SVGSVGElement, [x, y]: [number, number]) {
  const r = svg.getBoundingClientRect()
  return { x: r.left + (px(x) / W) * r.width, y: r.top + (px(y) / H) * r.height, unit: (cell / W) * r.width }
}
