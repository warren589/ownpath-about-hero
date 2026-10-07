import { useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  DISCIPLINES,
  disciplineLabels,
  desktopLayout,
  mobileLayout,
  MOBILE_BREAKPOINT,
  paragraphAnchors,
  type Discipline,
} from './config'
import { iconMarkup } from './icons'
import { createHeroTimeline, type HeroRefs, type NodeRefs } from './timeline'
import './AboutHero.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const HEADLINE = ['Many disciplines.', 'One path forward.']
const SUPPORTING = 'Strategy, design and engineering — brought together.'

function Icon({ id, className }: { id: Discipline; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: iconMarkup[id] }} />
}

/** Splits the paragraph into words; an anchored icon stays glued to the word it introduces. */
function Statement() {
  const out: ReactNode[] = []
  paragraphAnchors.forEach((seg, si) => {
    const words = seg.text.split(' ')
    const Tag = seg.italic ? 'em' : 'span'
    words.forEach((word, wi) => {
      const key = `${si}-${wi}`
      const w = (
        <Tag key={`w${key}`} className="about-hero__word">
          {word}
        </Tag>
      )
      if (out.length && !(seg.noSpaceBefore && wi === 0)) out.push(' ')
      if (seg.icon && wi === 0) {
        out.push(
          <span key={`g${key}`} className="about-hero__glue">
            <span className="about-hero__anchor" data-anchor={seg.icon}>
              <Icon id={seg.icon} className="about-hero__anchor-icon" />
            </span>
            {w}
          </span>,
        )
      } else {
        out.push(w)
      }
    })
  })
  return <>{out}</>
}

export function AboutHero() {
  const stageRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const stage = stageRef.current!
      const q = <T extends Element>(sel: string) => Array.from(stage.querySelectorAll<T>(sel))

      const collectRefs = (): HeroRefs => {
        const nodes = {} as Record<Discipline, NodeRefs>
        for (const id of DISCIPLINES) {
          const root = stage.querySelector<HTMLElement>(`[data-node="${id}"]`)!
          nodes[id] = {
            root,
            body: root.querySelector('.about-hero__node-body')!,
            tile: root.querySelector('.about-hero__tile')!,
            icon: root.querySelector('.about-hero__node-icon')!,
            label: root.querySelector('.about-hero__label')!,
          }
        }
        const anchors: HeroRefs['anchors'] = {}
        for (const el of q<HTMLElement>('.about-hero__anchor[data-anchor]')) {
          anchors[el.dataset.anchor as Discipline] = el
        }
        return {
          stage,
          headlineItems: q<HTMLElement>('[data-headline-item]'),
          nodes,
          anchor: stage.querySelector<HTMLElement>('.about-hero__anchor-point')!,
          grid: stage.querySelector<SVGSVGElement>('.about-hero__grid')!,
          gridPath: stage.querySelector<SVGPathElement>('.about-hero__grid path')!,
          connectorLayer: stage.querySelector<SVGGElement>('[data-connector-layer]')!,
          connectorPaths: Object.fromEntries(
            q<SVGPathElement>('[data-connector]').map((p) => [p.dataset.connector!, p]),
          ),
          statement: stage.querySelector<HTMLElement>('.about-hero__statement-text')!,
          words: q<HTMLElement>('.about-hero__word'),
          anchors,
        }
      }

      const mm = gsap.matchMedia()
      let cancelled = false

      // Rebuilding removes the pin spacer, which makes the browser clamp the
      // scroll position. Track where the reader is relative to the pin so a
      // rebuild (resize / breakpoint change) can put them back in place.
      let live: gsap.core.Timeline | null = null
      let resume = { progress: 0, overshoot: 0 }
      const track = () => {
        const st = live?.scrollTrigger
        if (!st) return
        resume = { progress: st.progress, overshoot: Math.max(0, window.scrollY - st.end) }
      }
      const build = (layout: typeof desktopLayout) => {
        const tl = createHeroTimeline(collectRefs(), layout)
        ScrollTrigger.refresh()
        const st = tl.scrollTrigger!
        if (resume.progress > 0) {
          window.scrollTo(0, st.start + (st.end - st.start) * resume.progress + resume.overshoot)
          tl.progress(resume.progress)
        }
        live = tl
        return tl
      }
      window.addEventListener('scroll', track, { passive: true })

      // Build only once the supplied fonts are in, so the final icon anchors
      // are measured against the real typography.
      document.fonts.ready.then(() => {
        if (cancelled) return
        mm.add(
          {
            desktop: `(min-width: ${MOBILE_BREAKPOINT}px) and (prefers-reduced-motion: no-preference)`,
            mobile: `(max-width: ${MOBILE_BREAKPOINT - 1}px) and (prefers-reduced-motion: no-preference)`,
          },
          (ctx) => {
            stage.classList.add('is-animated')
            const layout = ctx.conditions!.desktop ? desktopLayout : mobileLayout
            let tl = build(layout)

            // Geometry depends on the stage size: rebuild on width changes.
            // (Height-only changes are mobile browser chrome — ignored.)
            let lastWidth = window.innerWidth
            let timer = 0
            const onResize = () => {
              if (window.innerWidth === lastWidth) return
              lastWidth = window.innerWidth
              window.clearTimeout(timer)
              timer = window.setTimeout(() => {
                ctx.add(() => {
                  live = null
                  // revert() restores every tweened element (and the pin) to its
                  // pre-timeline state, so the rebuild starts from clean values.
                  tl.revert()
                  tl = build(layout)
                })
              }, 150)
            }
            window.addEventListener('resize', onResize)
            return () => {
              live = null
              window.removeEventListener('resize', onResize)
              window.clearTimeout(timer)
              stage.classList.remove('is-animated')
            }
          },
        )
      })

      return () => {
        cancelled = true
        window.removeEventListener('scroll', track)
        mm.revert()
      }
    },
    { scope: stageRef },
  )

  return (
    <section className="about-hero" aria-labelledby="about-hero-title">
      <div className="about-hero__stage" ref={stageRef}>
        {/* Underlying structure for the system; sits behind all content. */}
        <svg className="about-hero__grid" aria-hidden="true">
          <path />
        </svg>

        <header className="about-hero__intro">
          <h1 id="about-hero-title" className="about-hero__headline">
            {HEADLINE.map((line) => (
              <span key={line} className="about-hero__headline-line" data-headline-item>
                {line}
              </span>
            ))}
          </h1>
          <p className="about-hero__supporting" data-headline-item>
            {SUPPORTING}
          </p>
        </header>

        {/* The visual system: decorative, the copy carries the meaning. */}
        <div className="about-hero__system" aria-hidden="true">
          <svg className="about-hero__connectors">
            <g data-connector-layer>
              {desktopLayout.connectorPaths.map((c) => (
                <path key={c.id} data-connector={c.id} className="about-hero__connector" />
              ))}
            </g>
          </svg>
          <div className="about-hero__node">
            <div className="about-hero__anchor-point" />
          </div>
          {DISCIPLINES.map((id) => (
            <div key={id} className="about-hero__node" data-node={id}>
              <div className="about-hero__node-body">
                <div className="about-hero__tile" />
                <Icon id={id} className="about-hero__node-icon" />
              </div>
              <span className="about-hero__label">{disciplineLabels[id]}</span>
            </div>
          ))}
        </div>

        <div className="about-hero__statement">
          <p className="about-hero__statement-text">
            <Statement />
          </p>
        </div>
      </div>
    </section>
  )
}
