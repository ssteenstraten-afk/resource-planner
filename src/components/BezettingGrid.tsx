import { useState } from 'react'
import type { WeekInfo } from '../lib/weekUtils'
import type { BezettingRij, WijzigingMap } from '../hooks/useBezetting'
import { WeekHeader } from './WeekHeader'
import { BezettingCell } from './BezettingCell'
import { BeschikbaarheidBar } from './BeschikbaarheidBar'

interface Props {
  rijen: BezettingRij[]
  weken: WeekInfo[]
  weekTotalen: Array<{ key: string; jaar: number; week: number; totaalUren: number }>
  contractUren: number
  readonly?: boolean
  onOpslaan?: (wijzigingen: WijzigingMap) => Promise<void>
  opslaanBezig?: boolean
}

export function BezettingGrid({
  rijen,
  weken,
  weekTotalen,
  contractUren,
  readonly = false,
  onOpslaan,
  opslaanBezig = false,
}: Props) {
  const [wijzigingen, setWijzigingen] = useState<WijzigingMap>({})

  function verwerkWijziging(projectId: string, weekKey: string, uren: number) {
    setWijzigingen(prev => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] ?? {}),
        [weekKey]: uren,
      },
    }))
  }

  function isGewijzigd(projectId: string, weekKey: string): boolean {
    return wijzigingen[projectId]?.[weekKey] !== undefined
  }

  function getUren(rij: BezettingRij, weekKey: string): number {
    const wijziging = wijzigingen[rij.project.id]?.[weekKey]
    return wijziging !== undefined ? wijziging : (rij.weken[weekKey] ?? 0)
  }

  const liveWeekTotalen = weekTotalen.map(wt => {
    let totaal = 0
    for (const rij of rijen) {
      totaal += getUren(rij, wt.key)
    }
    return { ...wt, totaalUren: totaal }
  })

  const heeftWijzigingen = Object.keys(wijzigingen).length > 0

  async function handleOpslaan() {
    if (!onOpslaan || !heeftWijzigingen) return
    await onOpslaan(wijzigingen)
    setWijzigingen({})
  }

  return (
    <div className="bezetting-grid-wrapper">
      <div className="tabel-scroll">
        <table className="bezetting-tabel">
          <thead>
            <tr>
              <th className="project-kolom">Project</th>
              <WeekHeader weken={weken} />
            </tr>
          </thead>
          <tbody>
            {rijen.map(rij => (
              <tr key={rij.project.id} className={rij.project.is_systeem ? 'rij-systeem' : ''}>
                <td className="project-naam">
                  <span className="project-naam-tekst">{rij.project.naam}</span>
                  {rij.project.klant && (
                    <span className="project-klant">{rij.project.klant}</span>
                  )}
                </td>
                {weken.map(w => {
                  const weekKey = `${w.jaar}-${w.week}`
                  const uren = getUren(rij, weekKey)
                  const weekTotaal = liveWeekTotalen.find(wt => wt.key === weekKey)?.totaalUren ?? 0
                  return (
                    <BezettingCell
                      key={weekKey}
                      uren={uren}
                      gewijzigd={isGewijzigd(rij.project.id, weekKey)}
                      readonly={readonly}
                      weekTotaal={weekTotaal}
                      onWijzig={u => verwerkWijziging(rij.project.id, weekKey, u)}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
          <BeschikbaarheidBar weken={liveWeekTotalen} contractUren={contractUren} />
        </table>
      </div>

      {!readonly && (
        <div className="grid-acties">
          {heeftWijzigingen && (
            <span className="onopgeslagen-melding">
              You have unsaved changes
            </span>
          )}
          <button
            className="btn-primair"
            onClick={handleOpslaan}
            disabled={!heeftWijzigingen || opslaanBezig}
          >
            {opslaanBezig ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  )
}
