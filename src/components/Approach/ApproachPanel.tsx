import { forwardRef } from 'react'
import { ApproachGraphic } from './ApproachGraphic'
import type { Principle } from './content'

export type PanelState = 'idle' | 'active' | 'next'

type Props = {
  principle: Principle
  state: PanelState
  onActivate?: () => void
  onDeactivate?: () => void
}

export const ApproachPanel = forwardRef<HTMLElement, Props>(function ApproachPanel(
  { principle, state, onActivate, onDeactivate },
  ref,
) {
  return (
    <article
      ref={ref}
      className={`ap-panel ap-panel--${principle.theme}`}
      data-state={state}
      onPointerEnter={onActivate}
      onPointerLeave={onDeactivate}
    >
      <span className="ap-panel__index">{principle.index}</span>
      <div className="ap-panel__visual">
        <ApproachGraphic graphic={principle.graphic} />
      </div>
      <div className="ap-panel__text">
        <h3 className="ap-panel__title">{principle.title}</h3>
        <p className="ap-panel__body">{principle.body}</p>
      </div>
    </article>
  )
})
