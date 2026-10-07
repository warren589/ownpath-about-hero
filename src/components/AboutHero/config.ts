/**
 * About hero — choreography configuration.
 *
 * Every spatial and temporal value the animation uses lives here, so the
 * sequence can be tuned without touching the timeline code.
 *
 * Coordinate conventions
 * ----------------------
 * - iconStartPositions:    fractions of the pinned stage (0–1 on each axis).
 * - iconConvergePositions: grid units relative to `systemCenter`. One unit is
 *                          `unit(stageWidth, stageHeight)` pixels.
 * - iconFinalPositions:    not fixed numbers — measured at runtime from the
 *                          inline anchors inside the final paragraph
 *                          (see `paragraphAnchors`), so they always match the
 *                          real text layout.
 *
 * Timing conventions
 * ------------------
 * Durations are abstract timeline units. The whole timeline is scrubbed by
 * scroll, so only their proportions matter; `scrollLength` decides how much
 * scrolling the full sequence takes.
 */

export const DISCIPLINES = ['strategy', 'design', 'engineering', 'people', 'impact'] as const
export type Discipline = (typeof DISCIPLINES)[number]

export const disciplineLabels: Record<Discipline, string> = {
  strategy: 'Strategy',
  design: 'Design',
  engineering: 'Engineering',
  people: 'People',
  impact: 'Impact',
}

export type Point = { x: number; y: number }

export type ConnectorDef = {
  id: string
  from: Discipline
  to: Discipline
  /**
   * 'straight' — direct line (nodes are aligned on the layout axis).
   * 'step'     — Ownpath stepped route: travel along the layout axis, step
   *              across, then continue along the axis into the target.
   *              Falls back to straight when the two nodes are aligned.
   */
  route: 'straight' | 'step'
  /** For 'step' routes: where the step happens, 0 = at `from`, 1 = at `to`. */
  stepAt?: number
}

export type LayoutConfig = {
  name: 'desktop' | 'mobile'
  /** Size of one grid unit in px for a given stage size. */
  unit: (w: number, h: number) => number
  /** Node tile edge length, in grid units. */
  tileSize: number
  /** Tile corner radius as a fraction of the tile edge. */
  tileRadius: number
  /** Icon size inside a tile, as a fraction of the tile edge. */
  iconInTile: number
  /** Icon scale in STATE 01 relative to its in-tile size (icons read larger when standalone). */
  iconStartScale: number
  /** Connector stroke width, in grid units. */
  connectorWidth: number
  /** Corner radius of stepped connectors, in grid units. */
  connectorRadius: number
  /** Keep discipline labels under the tiles in STATE 04 (off where connectors would cross them). */
  labelsInSystem: boolean
  /** Primary direction of travel for stepped connectors. */
  axis: 'x' | 'y'
  /** Centre of the connected system, as stage fractions. */
  systemCenter: Point
  iconStartPositions: Record<Discipline, Point>
  iconConvergePositions: Record<Discipline, Point>
  connectorPaths: ConnectorDef[]
  /** Scale of the whole system at the end of STATE 05. */
  shrinkScale: number
  /** Pinned scroll distance, as a multiple of the viewport height. */
  scrollLength: number
}

/** Order in which nodes travel into the system (STATE 02/03). */
export const convergeOrder: Discipline[] = ['people', 'design', 'strategy', 'engineering', 'impact']

/**
 * The connected system reads left → right: three disciplines merge into one
 * team, which carries a single path forward to impact.
 */
const desktopConnectors: ConnectorDef[] = [
  { id: 'design-people', from: 'design', to: 'people', route: 'straight' },
  { id: 'strategy-people', from: 'strategy', to: 'people', route: 'step', stepAt: 0.5 },
  { id: 'engineering-people', from: 'engineering', to: 'people', route: 'step', stepAt: 0.5 },
  // The single path forward carries the Ownpath step.
  { id: 'people-impact', from: 'people', to: 'impact', route: 'step', stepAt: 0.5 },
]

export const desktopLayout: LayoutConfig = {
  name: 'desktop',
  unit: (w, h) => Math.min(w / 17, h / 9.5),
  tileSize: 1.3,
  tileRadius: 0.24,
  iconInTile: 0.46,
  iconStartScale: 1.32,
  connectorWidth: 0.32,
  connectorRadius: 0.26,
  labelsInSystem: true,
  axis: 'x',
  systemCenter: { x: 0.5, y: 0.56 },
  iconStartPositions: {
    strategy: { x: 0.62, y: 0.25 },
    design: { x: 0.87, y: 0.43 },
    engineering: { x: 0.64, y: 0.69 },
    people: { x: 0.2, y: 0.81 },
    impact: { x: 0.9, y: 0.83 },
  },
  iconConvergePositions: {
    strategy: { x: -5, y: -2.4 },
    design: { x: -5, y: 0 },
    engineering: { x: -5, y: 2.4 },
    people: { x: 0, y: 0 },
    impact: { x: 5, y: -1.2 },
  },
  connectorPaths: desktopConnectors,
  shrinkScale: 0.55,
  scrollLength: 4.5,
}

/** Mobile: the same story, re-drawn vertically (disciplines on top, impact below). */
export const mobileLayout: LayoutConfig = {
  name: 'mobile',
  unit: (w, h) => Math.min(w / 8.6, h / 13),
  tileSize: 1.35,
  tileRadius: 0.24,
  iconInTile: 0.48,
  iconStartScale: 1.25,
  connectorWidth: 0.34,
  connectorRadius: 0.28,
  labelsInSystem: false,
  axis: 'y',
  systemCenter: { x: 0.5, y: 0.56 },
  iconStartPositions: {
    strategy: { x: 0.24, y: 0.55 },
    design: { x: 0.76, y: 0.5 },
    engineering: { x: 0.56, y: 0.67 },
    people: { x: 0.2, y: 0.84 },
    impact: { x: 0.8, y: 0.82 },
  },
  iconConvergePositions: {
    strategy: { x: -2.7, y: -3 },
    design: { x: 0, y: -3 },
    engineering: { x: 2.7, y: -3 },
    people: { x: 0, y: 0 },
    impact: { x: 1.35, y: 3.1 },
  },
  connectorPaths: desktopConnectors,
  shrinkScale: 0.6,
  scrollLength: 3.6,
}

/** Stage width (px) below which the mobile layout is used. */
export const MOBILE_BREAKPOINT = 768

/**
 * The final paragraph. Segments with an `icon` get an inline anchor in front
 * of their first word; the icon and that word never wrap apart.
 * `People` is intentionally left out of the sentence — it is the hub that
 * holds the system together and dissolves as the statement takes over.
 */
export type ParagraphSegment = { text: string; icon?: Discipline; italic?: boolean; noSpaceBefore?: boolean }

export const paragraphAnchors: ParagraphSegment[] = [
  { text: 'We combine' },
  { text: 'design,', icon: 'design' },
  { text: 'engineering,', icon: 'engineering' },
  { text: 'and' },
  { text: 'strategy', icon: 'strategy' },
  { text: 'to help industry leaders turn their vision into' },
  { text: 'impactful digital experiences', icon: 'impact', italic: true },
  { text: '.', noSpaceBefore: true },
]

/** Timeline units (see "Timing conventions" above). */
export const animationDurations = {
  /** STATE 01 held before anything moves. */
  introHold: 0.5,
  headlineOut: 1.0,
  headlineStagger: 0.12,
  /** STATE 02: one node's journey into the system. */
  converge: 1.8,
  /** Delay between consecutive nodes starting their journey. */
  convergeStagger: 0.62,
  /** Tile forms around the icon during the last part of its journey. */
  tileForm: 0.8,
  /** Point in a node's journey (0–1) at which its tile begins to form. */
  tileFormAt: 0.55,
  /** STATE 03: connector draw duration. */
  connectorDraw: 0.95,
  /** Connector starts drawing this long before its node arrives. */
  connectorLead: 0.4,
  /** STATE 04: the complete system holds still. */
  systemHold: 0.8,
  labelsOut: 0.45,
  /** STATE 05: the whole system shrinks toward the paragraph. */
  shrink: 1.5,
  /** STATE 06 starts this far into the shrink, so the two read as one move. */
  settleOverlap: 0.75,
  /** STATE 06: icons travel into their paragraph anchors. */
  settle: 1.6,
  /** Portion of the settle (0–1) over which the tile dissolves back into a bare icon. */
  tileDissolve: 0.4,
  /** Connectors retract (and fade) from this point of the shrink (0–1). */
  connectorRetractAt: 0.6,
  connectorRetract: 0.7,
  hubOut: 0.7,
  /** Words begin to appear this long after the first icon leaves the system. */
  textRevealAt: 0.55,
  textReveal: 0.8,
  textStagger: 0.035,
  /** STATE 07: final composition held before the pin releases. */
  restHold: 0.5,
}

/** Eases are GSAP ease strings, applied to normalised progress. */
export const animationEasing = {
  /** Scroll smoothing — seconds the playhead takes to catch up with scroll. */
  scrub: 0.9,
  headlineOut: 'power2.in',
  convergeX: 'power2.inOut',
  /** A softer vertical ease than horizontal gives each path a gentle arc. */
  convergeY: 'sine.inOut',
  tileForm: 'power2.out',
  connectorDraw: 'power1.inOut',
  shrink: 'power2.inOut',
  settle: 'power3.inOut',
  connectorRetract: 'power2.in',
  textReveal: 'power2.out',
}

/** Brand colours as used by the animation (mirrors the CSS tokens). */
export const colors = {
  ink: '#000000',
  onBlue: '#F6F6F4',
  blue: '#0342F0',
}
