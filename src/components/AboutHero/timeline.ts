import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  animationDurations as D,
  animationEasing as E,
  colors,
  convergeOrder,
  DISCIPLINES,
  type Discipline,
  type LayoutConfig,
  type Point,
} from './config'
import { lerp, lerpPoint, resolveGeometry } from './geometry'

gsap.registerPlugin(ScrollTrigger)

/** root: positioned (unscaled) · body: scaled tile + icon · label: unscaled caption. */
export type NodeRefs = { root: HTMLElement; body: HTMLElement; tile: HTMLElement; icon: HTMLElement; label: HTMLElement }

export type HeroRefs = {
  stage: HTMLElement
  headlineItems: HTMLElement[]
  nodes: Record<Discipline, NodeRefs>
  connectorLayer: SVGGElement
  connectorPaths: Record<string, SVGPathElement>
  statement: HTMLElement
  words: HTMLElement[]
  anchors: Partial<Record<Discipline, HTMLElement>>
}

/**
 * Builds the single scroll-scrubbed master timeline.
 *
 * The node choreography is driven by plain progress values (0–1) that are
 * tweened on the timeline and combined in one `render()` per tick. Because
 * every phase writes to its own progress value, phases can overlap freely
 * (shrink → settle, draw → retract) and the motion stays continuous in both
 * scroll directions — no two tweens ever fight over the same property.
 */
export function createHeroTimeline(refs: HeroRefs, layout: LayoutConfig): gsap.core.Timeline {
  const { stage } = refs
  const stageRect = stage.getBoundingClientRect()
  const g = resolveGeometry(layout, stageRect.width, stageRect.height)

  // ---- Measure the final resting positions from the real text layout ------
  const relCenter = (el: Element): Point => {
    const r = el.getBoundingClientRect()
    return { x: r.left - stageRect.left + r.width / 2, y: r.top - stageRect.top + r.height / 2 }
  }
  const iconFinalPositions: Partial<Record<Discipline, { point: Point; scale: number }>> = {}
  for (const id of DISCIPLINES) {
    const anchor = refs.anchors[id]
    if (!anchor) continue
    iconFinalPositions[id] = { point: relCenter(anchor), scale: anchor.getBoundingClientRect().width / g.icon }
  }
  const statementCenter = relCenter(refs.statement)

  // ---- Apply resolved geometry to the DOM --------------------------------
  for (const id of DISCIPLINES) {
    const n = refs.nodes[id]
    gsap.set(n.body, { width: g.icon, height: g.icon, left: -g.icon / 2, top: -g.icon / 2 })
    gsap.set(n.tile, { width: g.tile, height: g.tile, borderRadius: g.tile * layout.tileRadius })
  }
  const pathLengths: Record<string, number> = {}
  for (const { def, d } of g.connectors) {
    const path = refs.connectorPaths[def.id]
    path.setAttribute('d', d)
    path.setAttribute('stroke-width', String(layout.connectorWidth * g.unit))
    const len = path.getTotalLength()
    pathLengths[def.id] = len
    path.style.strokeDasharray = `${len} ${len}`
  }

  // ---- Progress state ------------------------------------------------------
  const node = Object.fromEntries(
    DISCIPLINES.map((id) => [id, { converge: 0, tile: 0, settle: 0 }]),
  ) as Record<Discipline, { converge: number; tile: number; settle: number }>
  const system = { shrink: 0, labels: 1, hubOut: 0 }
  const connector = Object.fromEntries(g.connectors.map(({ def }) => [def.id, { draw: 0, retract: 0 }]))

  const ease = {
    convergeX: gsap.parseEase(E.convergeX),
    convergeY: gsap.parseEase(E.convergeY),
    tileForm: gsap.parseEase(E.tileForm),
    shrink: gsap.parseEase(E.shrink),
    settle: gsap.parseEase(E.settle),
    connectorDraw: gsap.parseEase(E.connectorDraw),
    connectorRetract: gsap.parseEase(E.connectorRetract),
  }
  const mixColor = gsap.utils.interpolate as (a: string, b: string, t: number) => string
  // Shrink maps the converged system onto the paragraph: scale about the
  // system centre while translating that centre onto the paragraph centre.
  const shrinkDelta = { x: statementCenter.x - g.center.x, y: statementCenter.y - g.center.y }
  const labelGap = g.unit * 0.32

  const render = () => {
    const sh = ease.shrink(system.shrink)
    const k = lerp(1, layout.shrinkScale, sh)

    for (const id of DISCIPLINES) {
      const s = node[id]
      const n = refs.nodes[id]
      const ex = ease.convergeX(s.converge)
      const ey = ease.convergeY(s.converge)
      const tf = ease.tileForm(s.tile)
      const st = ease.settle(s.settle)
      // The tile dissolves early in the flight so a bare icon arrives in the text.
      const dissolve = ease.tileForm(Math.min(1, s.settle / D.tileDissolve))

      // STATE 01 → 04: free-floating → converged
      const conv = { x: lerp(g.start[id].x, g.converge[id].x, ex), y: lerp(g.start[id].y, g.converge[id].y, ey) }
      let scale = lerp(layout.iconStartScale, 1, ex)
      // STATE 05: the whole system shrinks as one body
      let p = {
        x: g.center.x + (conv.x - g.center.x) * k + shrinkDelta.x * sh,
        y: g.center.y + (conv.y - g.center.y) * k + shrinkDelta.y * sh,
      }
      scale *= k
      // STATE 06: each icon leaves the system for its place in the sentence
      const final = iconFinalPositions[id]
      let opacity = 1
      if (final) {
        p = lerpPoint(p, final.point, st)
        scale = lerp(scale, final.scale, st)
      } else {
        const out = ease.settle(system.hubOut)
        scale *= 1 - out
        opacity = 1 - out
      }

      n.root.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
      n.root.style.opacity = String(opacity)
      n.body.style.transform = `scale(${scale})`
      n.tile.style.transform = `translate(-50%, -50%) scale(${tf * (1 - dissolve)})`
      n.icon.style.color = mixColor(mixColor(colors.ink, colors.onBlue, tf), colors.blue, dissolve)
      // Label sits just under the bare icon, then just under the tile.
      const labelY = lerp((g.icon * layout.iconStartScale) / 2, g.tile / 2, tf) + labelGap
      n.label.style.transform = `translate(-50%, ${labelY}px)`
      n.label.style.opacity = String(system.labels * (layout.labelsInSystem ? 1 : 1 - tf))
    }

    refs.connectorLayer.setAttribute(
      'transform',
      `translate(${shrinkDelta.x * sh} ${shrinkDelta.y * sh}) translate(${g.center.x} ${g.center.y}) scale(${k}) translate(${-g.center.x} ${-g.center.y})`,
    )
    let retracted = 1
    for (const { def } of g.connectors) {
      const c = connector[def.id]
      retracted = Math.min(retracted, c.retract)
      const len = pathLengths[def.id]
      const path = refs.connectorPaths[def.id]
      path.style.strokeDashoffset = String(
        len * (1 - ease.connectorDraw(c.draw)) - len * ease.connectorRetract(c.retract),
      )
      path.style.visibility = c.draw > 0 && c.retract < 1 ? 'visible' : 'hidden'
    }
    refs.connectorLayer.style.opacity = String(1 - ease.connectorRetract(retracted))
  }

  // ---- Initial DOM state ---------------------------------------------------
  gsap.set(refs.words, { opacity: 0, yPercent: 35 })
  render()

  // ---- Master timeline -----------------------------------------------------
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: render,
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: () => `+=${window.innerHeight * layout.scrollLength}`,
      pin: true,
      scrub: E.scrub,
      anticipatePin: 1,
      // Jump straight to the scroll position after a (re)build or resize
      // instead of scrubbing up from the start.
      onRefresh: (self) => tl.progress(self.progress),
    },
  })

  // STATE 01 — DISCONNECTED (held)
  tl.addLabel('disconnected', 0)
  tl.addLabel('movement', D.introHold)

  tl.to(
    refs.headlineItems,
    { opacity: 0, y: -g.unit * 0.6, duration: D.headlineOut, stagger: D.headlineStagger, ease: E.headlineOut },
    'movement',
  )

  // STATE 02 + 03 — MOVEMENT → CONNECTION
  // icon moves → its connector grows → the next icon joins → …
  const arrival: Partial<Record<Discipline, number>> = {}
  convergeOrder.forEach((id, i) => {
    const at = D.introHold + 0.2 + i * D.convergeStagger
    arrival[id] = at + D.converge
    tl.to(node[id], { converge: 1, duration: D.converge }, at)
    tl.to(node[id], { tile: 1, duration: D.tileForm }, at + D.converge * D.tileFormAt)
  })
  let lastDrawEnd = 0
  for (const { def } of g.connectors) {
    // A connector grows as soon as both ends are (nearly) in place.
    const ready = Math.max(arrival[def.from] ?? 0, arrival[def.to] ?? 0) - D.connectorLead
    tl.to(connector[def.id], { draw: 1, duration: D.connectorDraw }, ready)
    lastDrawEnd = Math.max(lastDrawEnd, ready + D.connectorDraw)
  }

  // STATE 04 — ONE SYSTEM (held)
  tl.addLabel('system', lastDrawEnd)

  // STATE 05 — SHRINK
  const shrinkAt = lastDrawEnd + D.systemHold
  tl.addLabel('shrink', shrinkAt)
  tl.to(system, { labels: 0, duration: D.labelsOut }, shrinkAt)
  tl.to(system, { shrink: 1, duration: D.shrink }, shrinkAt)

  // STATE 06 — INTO TYPOGRAPHY
  const settleAt = shrinkAt + D.shrink * D.settleOverlap
  tl.addLabel('typography', settleAt)
  const anchored = convergeOrder.filter((id) => iconFinalPositions[id])
  // Icons land in reading order, so the sentence assembles left to right.
  anchored
    .sort((a, b) => readingOrder(iconFinalPositions[a]!.point, iconFinalPositions[b]!.point))
    .forEach((id, i) => tl.to(node[id], { settle: 1, duration: D.settle }, settleAt + i * 0.12))
  tl.to(system, { hubOut: 1, duration: D.hubOut }, settleAt)
  for (const { def } of g.connectors) {
    tl.to(connector[def.id], { retract: 1, duration: D.connectorRetract }, shrinkAt + D.shrink * D.connectorRetractAt)
  }
  tl.to(
    refs.words,
    { opacity: 1, yPercent: 0, duration: D.textReveal, stagger: D.textStagger, ease: E.textReveal },
    settleAt + D.textRevealAt,
  )

  // STATE 07 — FINAL RESTING STATE
  tl.addLabel('rest')
  tl.to({}, { duration: D.restHold })

  return tl
}

const readingOrder = (a: Point, b: Point) => (Math.abs(a.y - b.y) > 4 ? a.y - b.y : a.x - b.x)
