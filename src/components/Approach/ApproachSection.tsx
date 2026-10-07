import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { roundedPolyline } from '../AboutHero/geometry'
import { BAR_WIDTH, cellToClient } from './ApproachGraphic'
import { ApproachPanel, type PanelState } from './ApproachPanel'
import { approachHeading, principles } from './content'
import { hoverMotion, revealMotion, scrollActivation } from './motion'
import './Approach.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const MOBILE = '(max-width: 767px)'
const HOVER = '(hover: hover) and (pointer: fine)'
const REDUCED = '(prefers-reduced-motion: reduce)'
/** The hero's pin (built after fonts load) shifts everything below it; refresh after it. */
const AFTER_HERO = -1

type Link = { d: string; width: number }

const motionVars = {
  '--ap-duration': `${hoverMotion.duration}ms`,
  '--ap-ease': hoverMotion.ease,
  '--ap-link-delay': `${hoverMotion.linkDelay}ms`,
  '--ap-link-duration': `${hoverMotion.linkDuration}ms`,
  '--ap-response-delay': `${hoverMotion.responseDelay}ms`,
  '--ap-resting-dim': hoverMotion.restingDim,
} as CSSProperties

export function ApproachSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<HTMLElement[]>([])
  const [active, setActive] = useState<number | null>(null)
  const [links, setLinks] = useState<Link[]>([])

  const stateOf = (i: number): PanelState =>
    active === i ? 'active' : active !== null && i === active + 1 ? 'next' : 'idle'

  // ---- Links between panels: measured from the rendered graphics ----------
  const measureLinks = useCallback(() => {
    const row = rowRef.current
    if (!row) return
    const origin = row.getBoundingClientRect()
    const svgs = panelRefs.current.map((p) => p.querySelector<SVGSVGElement>('.ap-graphic')!)
    const vertical = window.matchMedia(MOBILE).matches
    const next: Link[] = []

    for (let i = 0; i < principles.length - 1; i++) {
      const from = principles[i].graphic
      const to = principles[i + 1].graphic
      if (!from.exit || !to.entry) continue
      const entryNode = to.nodes.find((n) => n.entry)!
      const a = cellToClient(svgs[i], from.exit)
      const b = cellToClient(svgs[i + 1], to.entry)
      const rel = (p: { x: number; y: number }) => ({ x: p.x - origin.left, y: p.y - origin.top })
      const width = BAR_WIDTH * a.unit

      if (vertical) {
        // Stacked: drop from the bottom edge of this panel into the next
        // panel's entry node.
        const top = cellToClient(svgs[i + 1], [entryNode.at[0], entryNode.at[1] - entryNode.size / 2])
        const start = { x: top.x, y: panelRefs.current[i].getBoundingClientRect().bottom - 2 }
        next.push({ d: `M${rel(start).x},${rel(start).y} L${rel(top).x},${rel(top).y}`, width })
      } else {
        const p1 = rel(a)
        const p2 = rel(b)
        const mid = (p1.x + p2.x) / 2
        next.push({
          d: roundedPolyline(
            [p1, { x: mid, y: p1.y }, { x: mid, y: p2.y }, p2],
            width,
          ),
          width,
        })
      }
    }
    setLinks(next)
  }, [])

  useLayoutEffect(() => {
    measureLinks()
    const ro = new ResizeObserver(measureLinks)
    if (rowRef.current) ro.observe(rowRef.current)
    document.fonts.ready.then(measureLinks)
    return () => ro.disconnect()
  }, [measureLinks])

  // ---- Hover (fine pointers) ----------------------------------------------
  const canHover = () => window.matchMedia(HOVER).matches
  // Re-measure on activation: cheap, and always matches the settled layout.
  const activate = (i: number) => () => {
    if (!canHover()) return
    measureLinks()
    setActive(i)
  }
  const deactivate = (i: number) => () => canHover() && setActive((a) => (a === i ? null : a))

  // ---- Reveal + touch activation -------------------------------------------
  useGSAP(
    () => {
      const section = sectionRef.current!
      const heading = section.querySelector('.ap-section__heading')
      const panels = panelRefs.current

      if (!window.matchMedia(REDUCED).matches) {
        const R = revealMotion
        gsap.set(panels, { '--reveal': 0 })
        section.classList.add('is-revealing')
        gsap
          .timeline({
            scrollTrigger: { trigger: section, start: R.start, once: true, refreshPriority: AFTER_HERO },
            defaults: { ease: R.ease },
            onComplete: () => {
              section.classList.remove('is-revealing')
              measureLinks()
            },
          })
          .from(heading, { opacity: 0, y: R.headingOffset, duration: R.headingDuration })
          .from(
            panels,
            { opacity: 0, y: R.panelOffset, duration: R.panelDuration, stagger: R.panelStagger },
            0.15,
          )
          .to(
            panels,
            { '--reveal': 1, duration: R.graphicDuration, stagger: R.panelStagger },
            0.15 + R.graphicDelay,
          )
      }

      // Without hover, the panel crossing the middle of the viewport is the
      // active one, and its link drops down into the next panel.
      const mm = gsap.matchMedia()
      mm.add('(hover: none), (pointer: coarse)', () => {
        panels.forEach((panel, i) =>
          ScrollTrigger.create({
            trigger: panel,
            start: scrollActivation.start,
            end: scrollActivation.end,
            refreshPriority: AFTER_HERO,
            onToggle: (self) => {
              if (self.isActive) measureLinks()
              setActive((a) => (self.isActive ? i : a === i ? null : a))
            },
          }),
        )
        return () => setActive(null)
      })
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="ap-section"
      aria-labelledby="approach-title"
      style={motionVars}
    >
      <h2 id="approach-title" className="ap-section__heading">
        {approachHeading}
      </h2>

      <div ref={rowRef} className="ap-section__row" data-engaged={active !== null || undefined}>
        {principles.map((p, i) => (
          <ApproachPanel
            key={p.index}
            ref={(el) => {
              if (el) panelRefs.current[i] = el
            }}
            principle={p}
            state={stateOf(i)}
            onActivate={activate(i)}
            onDeactivate={deactivate(i)}
          />
        ))}

        {/* One approach: each principle extends a connector into the next. */}
        <svg className="ap-section__links" aria-hidden="true" focusable="false">
          {links.map((l, i) => (
            <path
              key={i}
              className="ap-section__link"
              d={l.d}
              pathLength={1}
              strokeWidth={l.width}
              data-on={active === i || undefined}
            />
          ))}
        </svg>
      </div>
    </section>
  )
}
