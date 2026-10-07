import strategySvg from '../../assets/icons/IconTactics1.svg?raw'
import designSvg from '../../assets/icons/IconBezierCurve.svg?raw'
import engineeringSvg from '../../assets/icons/IconCodeBrackets.svg?raw'
import peopleSvg from '../../assets/icons/IconUserGroup.svg?raw'
import impactSvg from '../../assets/icons/IconTargetArrow.svg?raw'
import type { Discipline } from './config'

/**
 * The supplied Central Icons, inlined unmodified apart from their paint:
 * hard-coded black becomes `currentColor`, so each icon can take the colour
 * of the state it is in (ink → on-blue → blue).
 */
const tint = (svg: string) =>
  svg
    .replace(/(stroke|fill)="black"/g, '$1="currentColor"')
    .replace('<svg ', '<svg aria-hidden="true" focusable="false" width="100%" height="100%" ')

export const iconMarkup: Record<Discipline, string> = {
  strategy: tint(strategySvg),
  design: tint(designSvg),
  engineering: tint(engineeringSvg),
  people: tint(peopleSvg),
  impact: tint(impactSvg),
}
