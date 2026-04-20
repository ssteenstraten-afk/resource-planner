import type { WeekInfo } from '../lib/weekUtils'
import { formatWeekRange } from '../lib/weekUtils'

interface Props {
  weken: WeekInfo[]
}

export function WeekHeader({ weken }: Props) {
  return (
    <>
      {weken.map(w => (
        <th key={`${w.jaar}-${w.week}`} className="week-header">
          <div className="week-nr">{w.label}</div>
          <div className="week-range">{formatWeekRange(w)}</div>
        </th>
      ))}
    </>
  )
}
