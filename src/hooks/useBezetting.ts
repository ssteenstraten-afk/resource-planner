import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Bezetting = Database['public']['Tables']['bezetting']['Row']
type Project = Database['public']['Tables']['projecten']['Row']

export interface BezettingRij {
  project: Project
  weken: Record<string, number> // key: "jaar-week", value: uren
  bezettingIds: Record<string, string> // key: "jaar-week", value: bezetting.id
}

export interface WeekTotaal {
  key: string
  jaar: number
  week: number
  totaalUren: number
}

interface UseBezettingResult {
  rijen: BezettingRij[]
  weekTotalen: WeekTotaal[]
  laden: boolean
  fout: string | null
  opslaan: (wijzigingen: WijzigingMap) => Promise<void>
  opslaanBezig: boolean
}

export type WijzigingMap = Record<string, Record<string, number>>
// WijzigingMap: { [projectId]: { ["jaar-week"]: uren } }

interface WeekSleutel {
  jaar: number
  week: number
}

export function useBezetting(
  consultantId: string | null,
  weken: WeekSleutel[]
): UseBezettingResult {
  const [bezettingen, setBezettingen] = useState<Bezetting[]>([])
  const [projecten, setProjecten] = useState<Project[]>([])
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [opslaanBezig, setOpslaanBezig] = useState(false)

  const laadData = useCallback(async () => {
    if (!consultantId || weken.length === 0) return
    setLaden(true)
    setFout(null)

    const minJaar = Math.min(...weken.map(w => w.jaar))
    const maxJaar = Math.max(...weken.map(w => w.jaar))

    const [bezResult, projResult] = await Promise.all([
      supabase
        .from('bezetting')
        .select('*')
        .eq('consultant_id', consultantId)
        .gte('jaar', minJaar)
        .lte('jaar', maxJaar),
      supabase
        .from('projecten')
        .select('*')
        .eq('status', 'actief')
        .order('is_systeem', { ascending: false })
        .order('naam'),
    ])

    if (bezResult.error) setFout(bezResult.error.message)
    else setBezettingen(bezResult.data ?? [])

    if (projResult.error) setFout(projResult.error.message)
    else setProjecten(projResult.data ?? [])

    setLaden(false)
  }, [consultantId, weken.map(w => `${w.jaar}-${w.week}`).join(',')])

  useEffect(() => {
    laadData()
  }, [laadData])

  // Bouw BezettingRij structuur op
  // Toon alleen projecten waar de consultant bezetting voor heeft + systeemprojecten
  const toegewezenProjectIds = new Set(bezettingen.map(b => b.project_id))
  const getoondProjecten = projecten.filter(
    p => p.is_systeem || toegewezenProjectIds.has(p.id)
  )

  const rijen: BezettingRij[] = getoondProjecten.map(project => {
    const wkenMap: Record<string, number> = {}
    const idsMap: Record<string, string> = {}
    bezettingen
      .filter(b => b.project_id === project.id)
      .forEach(b => {
        const key = `${b.jaar}-${b.week}`
        wkenMap[key] = b.uren
        idsMap[key] = b.id
      })
    return { project, weken: wkenMap, bezettingIds: idsMap }
  })

  // Bereken weektotalen
  const weekTotalen: WeekTotaal[] = weken.map(w => {
    const key = `${w.jaar}-${w.week}`
    const totaalUren = bezettingen
      .filter(b => b.jaar === w.jaar && b.week === w.week)
      .reduce((sum, b) => sum + b.uren, 0)
    return { key, jaar: w.jaar, week: w.week, totaalUren }
  })

  const opslaan = useCallback(async (wijzigingen: WijzigingMap) => {
    if (!consultantId) return
    setOpslaanBezig(true)
    setFout(null)

    try {
      const upserts: Database['public']['Tables']['bezetting']['Insert'][] = []

      for (const [projectId, weekWijzigingen] of Object.entries(wijzigingen)) {
        for (const [weekKey, uren] of Object.entries(weekWijzigingen)) {
          const [jaar, week] = weekKey.split('-').map(Number)
          upserts.push({
            consultant_id: consultantId,
            project_id: projectId,
            jaar,
            week,
            uren,
          })
        }
      }

      const { error } = await supabase
        .from('bezetting')
        .upsert(upserts, {
          onConflict: 'consultant_id,project_id,jaar,week',
        })

      if (error) throw error
      await laadData()
    } catch (e: unknown) {
      setFout(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setOpslaanBezig(false)
    }
  }, [consultantId, laadData])

  return { rijen, weekTotalen, laden, fout, opslaan, opslaanBezig }
}
