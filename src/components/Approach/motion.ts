/**
 * Our approach — motion values. Deliberately quieter than the hero.
 * Hover timings are exposed to CSS as custom properties (see ApproachSection).
 */

export const hoverMotion = {
  /** Graphic activation inside a panel. */
  duration: 700,
  /** ≈ power2.out */
  ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  /** Link to the next panel starts after the graphic begins to activate. */
  linkDelay: 140,
  linkDuration: 900,
  /** The next panel responds once the link has (almost) reached it. */
  responseDelay: 760,
  /** Opacity of graphics in panels that are neither active nor responding. */
  restingDim: 0.55,
}

export const revealMotion = {
  /** ScrollTrigger start for the reveal. */
  start: 'top 78%',
  headingDuration: 0.9,
  headingOffset: 28,
  panelDuration: 1.0,
  panelOffset: 36,
  panelStagger: 0.12,
  /** Graphics resolve after their panel lands. */
  graphicDelay: 0.3,
  graphicDuration: 1.1,
  ease: 'power3.out',
}

/** Mobile (no hover): a panel activates while it crosses this viewport band. */
export const scrollActivation = { start: 'top 55%', end: 'bottom 55%' }
