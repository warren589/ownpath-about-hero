/**
 * Our approach — content and graphic definitions.
 *
 * Graphics are described on a 12 × 8 cell grid (cell = `GRAPHIC.cell` SVG
 * units). Every panel shares the same grid, so the row y = 4 lines up across
 * all three panels: the links between panels travel along it.
 */

export const GRAPHIC = { cols: 12, rows: 8, cell: 30 } as const

export type Cell = [x: number, y: number]

export type GraphicNode = {
  id: string
  at: Cell
  /** Edge length in cells. */
  size: number
  tone: 'primary' | 'secondary'
  /** Hover: offset in cells. */
  shift?: Cell
  /** Hover: scale. */
  activeScale?: number
  /** Rendered as an outline at rest, filled when the panel is active. */
  outline?: boolean
  /** Where an incoming link from the previous panel lands; lights up when it arrives. */
  entry?: boolean
}

export type GraphicPath = {
  id: string
  points: Cell[]
  /** 'bar' = Ownpath connector, 'hair' = grid-weight guide line. */
  weight: 'bar' | 'hair'
  /** Drawn portion (0–1) at rest and when active. */
  draw: [rest: number, active: number]
}

export type Graphic = {
  nodes: GraphicNode[]
  paths: GraphicPath[]
  /** Where a link to the next panel leaves this graphic (cells). */
  exit?: Cell
  /** Where a link from the previous panel arrives (cells). */
  entry?: Cell
}

export type PanelTheme = 'blue' | 'neutral' | 'dark'

export type Principle = {
  index: string
  title: string
  body: string
  theme: PanelTheme
  graphic: Graphic
}

export const approachHeading = 'Our approach'

/** 01 — three elements → connection → one unit. */
const oneTeam: Graphic = {
  nodes: [
    { id: 'a', at: [2.5, 1.75], size: 1.1, tone: 'secondary', shift: [0.35, 0] },
    { id: 'b', at: [2.5, 4], size: 1.1, tone: 'secondary', shift: [0.35, 0] },
    { id: 'c', at: [2.5, 6.25], size: 1.1, tone: 'secondary', shift: [0.35, 0] },
    { id: 'unit', at: [8, 4], size: 1.9, tone: 'primary', activeScale: 1.06 },
  ],
  // Connectors start at each node's edge, so at rest they read as reaching out.
  paths: [
    { id: 'b-unit', points: [[3.05, 4], [8, 4]], weight: 'bar', draw: [0.2, 1] },
    { id: 'a-unit', points: [[3.05, 1.75], [5.25, 1.75], [5.25, 4], [8, 4]], weight: 'bar', draw: [0.14, 1] },
    { id: 'c-unit', points: [[3.05, 6.25], [5.25, 6.25], [5.25, 4], [8, 4]], weight: 'bar', draw: [0.14, 1] },
  ],
  exit: [9, 4],
}

/** 02 — question → exploration → focus. */
const problemFirst: Graphic = {
  nodes: [
    { id: 'in', at: [1.5, 4], size: 0.45, tone: 'secondary', entry: true, shift: [0.9, 0] },
    { id: 'p1', at: [3.5, 1.5], size: 0.45, tone: 'secondary', shift: [0.8, 0.85] },
    { id: 'p2', at: [9.5, 1.75], size: 0.45, tone: 'secondary', shift: [-1.2, 0.75] },
    { id: 'p3', at: [3, 6.5], size: 0.45, tone: 'secondary', shift: [1, -0.85] },
    { id: 'p4', at: [10, 6.25], size: 0.45, tone: 'secondary', shift: [-1.4, -0.75] },
    { id: 'anchor', at: [6, 4], size: 0.45, tone: 'primary', activeScale: 2.4 },
  ],
  // Guides grow out of the anchor: the grid itself narrows onto one point.
  paths: [
    { id: 'up', points: [[6, 4], [6, 0]], weight: 'hair', draw: [0, 1] },
    { id: 'down', points: [[6, 4], [6, 8]], weight: 'hair', draw: [0, 1] },
    { id: 'left', points: [[6, 4], [0, 4]], weight: 'hair', draw: [0, 1] },
    { id: 'right', points: [[6, 4], [12, 4]], weight: 'hair', draw: [0, 1] },
  ],
  entry: [1.27, 4],
  exit: [6.55, 4],
}

/** 03 — small node system → stepped path → outcome. */
const toImpact: Graphic = {
  nodes: [
    { id: 'in', at: [1.5, 4], size: 0.45, tone: 'secondary', entry: true },
    { id: 'start', at: [3, 4], size: 1, tone: 'primary', shift: [0.2, 0] },
    { id: 'outcome', at: [10, 2], size: 1.8, tone: 'primary', outline: true, activeScale: 1.04 },
  ],
  paths: [
    {
      id: 'path',
      points: [[3, 4], [5.25, 4], [5.25, 3], [7.5, 3], [7.5, 2], [10, 2]],
      weight: 'bar',
      // Rest ends on the first straight run, before the steps begin.
      draw: [0.2, 1],
    },
  ],
  entry: [1.27, 4],
}

export const principles: Principle[] = [
  {
    index: '01',
    title: 'Different minds. One team.',
    body: 'Strategy, design and engineering work together from day one.',
    theme: 'blue',
    graphic: oneTeam,
  },
  {
    index: '02',
    title: 'The problem before the deliverable.',
    body: 'We start with your goals, constraints and customers — not the output.',
    theme: 'neutral',
    graphic: problemFirst,
  },
  {
    index: '03',
    title: 'From idea to impact.',
    body: "We stay close to the work until it's ready to ship and make a difference.",
    theme: 'dark',
    graphic: toImpact,
  },
]
