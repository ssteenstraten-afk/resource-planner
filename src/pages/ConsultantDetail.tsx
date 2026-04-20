import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBezetting } from '../hooks/useBezetting'
import { getKomendeWeken } from '../lib/weekUtils'
import { BezettingGrid } from '../components/BezettingGrid'
import type { Database } from '../lib/database.types'

type Consultant = Database['public']['Tables']['consultants']['Row']

const WEKEN = getKomendeWeken(12)

export function ConsultantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [laden, setLaden] = useState(true)

  const { rijen, weekTotalen, laden: bezLaden } = useBezetting(id ?? null, WEKEN)

  useEffect(() => {
    if (!id) return
    supabase
      .from('consultants')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setConsultant(data)
        setLaden(false)
      })
  }, [id])

  if (laden || bezLaden) {
    return (
      <div className="laden-scherm">
        <div className="laden-spinner" />
        <p>Laden...</p>
      </div>
    )
  }

  if (!consultant) {
    return <div className="fout-banner">Consultant niet gevonden.</div>
  }

  return (
    <div className="pagina-wrapper">
      <div className="pagina-header">
        <div>
          <button className="btn-terug" onClick={() => navigate('/dashboard')}>
            ← Terug naar dashboard
          </button>
          <h1 className="pagina-titel">{consultant.naam}</h1>
          <p className="pagina-subtitel">
            {consultant.functieniveau} · {consultant.contract_uren}u/week · {consultant.email}
          </p>
        </div>
      </div>

      <BezettingGrid
        rijen={rijen}
        weken={WEKEN}
        weekTotalen={weekTotalen}
        contractUren={consultant.contract_uren}
        readonly
      />
    </div>
  )
}
