# Ownpath — About hero

A scroll-driven hero for the Ownpath About page, built with React, GSAP + ScrollTrigger and SVG.

**Disconnected → convergence → connection → one system → typographic statement**

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

## The sequence

The section is pinned and one master timeline, scrubbed by scroll, does all the motion:

| State | What happens |
| --- | --- |
| 01 Disconnected | Headline, supporting line and five standalone icons with quiet labels. The icons form a loose constellation around a tiny anchor point at the system centre, set on a near-invisible grid. |
| 02 Movement | The headline lifts away. The anchor grows into the first blue node while People travels into it, then the other icons follow one by one (a softer vertical ease gives each a slight arc). |
| 03 Connection | Each icon becomes a blue node as it arrives, and its connector grows outward from the hub to meet it. |
| 04 One system | Strategy, Design and Engineering merge into People, which carries one stepped path forward to Impact. |
| 05 Shrink | The whole system scales down as one body toward the paragraph. |
| 06 Into typography | Icons leave the system in reading order, shed their tiles and land inline. The connectors retract, the hub dissolves and the sentence fades in. |
| 07 Rest | Static paragraph. Nothing keeps moving, and the pin releases. |

`People` is left out of the sentence on purpose. It is the hub that holds the system together, and the statement ("*We* combine…") takes its place. Putting a fifth icon in the sentence made the first line too crowded.

## Tuning

Every value you would want to tweak is in [`src/components/AboutHero/config.ts`](src/components/AboutHero/config.ts):

- `desktopLayout` / `mobileLayout`: `iconStartPositions` and `iconConvergePositions` (both in grid units around `systemCenter`, the anchor), `hub`, `anchorSize`, `gridFade`, `connectorPaths`, tile, stroke and corner sizes, `shrinkScale`, `scrollLength`.
- `paragraphAnchors`: the final sentence and which word each icon introduces. The final icon positions are **measured** from these inline anchors, so they always match the real text layout.
- `convergeOrder`: the order nodes join the system.
- `animationDurations`: relative timeline units. Only the proportions matter; `scrollLength` sets how far the reader scrolls.
- `animationEasing`: GSAP ease strings for each phase, plus `scrub` smoothing.

How it works ([`timeline.ts`](src/components/AboutHero/timeline.ts)): each phase tweens its own progress value from 0 to 1, and a single `render()` combines them into transforms on every tick. Because of this, phases can overlap (shrink → settle, draw → retract) without tweens fighting over the same property, and scrubbing backwards works too. Connector paths are generated in [`geometry.ts`](src/components/AboutHero/geometry.ts) as orthogonal polylines with arc corners, then drawn with `stroke-dashoffset`.

### State 01 structure

One grid unit is both the system's layout module and the background grid cell, and the grid lines pass through the anchor. The constellation, the anchor and the connected system therefore share one underlying structure. The grid is a 1px hairline (`--op-grid` in `tokens.css`) that fades out radially around the anchor (`gridFade`) and dissolves as the system starts to shrink. Each icon starts on the same side as the place it takes in the system, so no path crosses the anchor. On desktop, the open upper-left sector of the ring is where the headline sits.

## Responsive and accessibility

- **≥ 768px:** a horizontal system. **< 768px:** the same story laid out vertically (disciplines on top, the hub, then the stepped path down to Impact). Labels fade as tiles form so they never sit under connectors.
- A width change rebuilds the timeline for the new stage size and keeps the reader at the same point in the sequence.
- **`prefers-reduced-motion: reduce`:** no pinning and no choreography. You get the headline, then the paragraph with its inline icons, and a short opacity fade.
- The headline and paragraph are real text (`h1`, `p`). The animated system is `aria-hidden`.

## Assets

- `src/assets/icons`: the five supplied Central Icons, inlined unmodified. Only their hard-coded black paint is swapped for `currentColor`.
- `src/assets/vectors`: the supplied Ownpath vectors, kept as the geometry reference. The connectors rebuild their language (thick bar, soft stepped corners) as editable paths.
- `src/assets/fonts`: Georgia Pro Light / Light Italic and Aeonik Regular, converted 1:1 to WOFF2 from the supplied files.

## Notes

- The **Aeonik trial** font only has basic Latin. The em dash in the supporting line falls back to the next font in the sans stack.
- No logo file was supplied, so the nav wordmark is a typeset stand-in. Replace `.nav__logo` with the real SVG.
- Font licensing: Georgia Pro is a Microsoft font and Aeonik is a CoType trial. Check the licences before shipping.

---

# Our approach

A quieter section directly below the hero: three editorial panels (blue / neutral / black) that read as one approach. Code lives in [`src/components/Approach`](src/components/Approach).

- **`content.ts`**: the heading, the three principles (copy, theme) and each panel's graphic, described as nodes and paths on a shared 12 × 8 grid. Row y = 4 is common to all three graphics, so the links between panels run along one line.
- **`motion.ts`**: hover timings (exposed to CSS as custom properties), reveal values and the mobile activation band.
- `ApproachSection` → `ApproachPanel` → `ApproachGraphic`. Connectors reuse the hero's `roundedPolyline` (read-only).

Interaction:

- **Reveal:** a single ScrollTrigger (`once`). The heading appears, then the panels with a stagger, then each graphic resolves.
- **Hover (fine pointers):** the active panel's graphic resolves (nodes gather, connectors complete, the grid strengthens). A blue link extends into the next panel, whose entry point lights up as the link arrives. The remaining panel steps back slightly.
- **Touch / mobile:** the panels stack vertically. The panel crossing the middle of the viewport becomes active, and its link drops vertically into the next panel.
- **Reduced motion:** no reveal, and state changes are instant.

The approach triggers use `refreshPriority: -1` so they are measured after the hero's pin spacer exists.
