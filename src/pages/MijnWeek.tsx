import { useAuth } from '../hooks/useAuth'
import { useBezetting } from '../hooks/useBezetting'
import { getKomendeWeken } from '../lib/weekUtils'
import { BezettingGrid } from '../components/BezettingGrid'

const WEKEN = getKomendeWeken(12)

export function MijnWeek() {
  const { consultant, laden: authLaden } = useAuth()
  const { rijen, weekTotalen, laden, fout, opslaan, opslaanBezig } = useBezetting(
    consultant?.id ?? null,
    WEKEN
  )

  if (authLaden || laden) {
    return (
      <div className="laden-scherm">
        <div className="laden-spinner" />
        <p>Bezetting laden...</p>
      </div>
    )
  }

  if (!consultant) return null

  return (
    <div className="pagina-wrapper">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titel">Mijn weekoverzicht</h1>
          <p className="pagina-subtitel">
            {consultant.naam} · {consultant.functieniveau} · {consultant.contract_uren}u/week
          </p>
        </div>
      </div>

      {fout && <div className="fout-banner">{fout}</div>}

      <BezettingGrid
        rijen={rijen}
        weken={WEKEN}
        weekTotalen={weekTotalen}
        contractUren={consultant.contract_uren}
        onOpslaan={opslaan}
        opslaanBezig={opslaanBezig}
      />
    </div>
  )
}
