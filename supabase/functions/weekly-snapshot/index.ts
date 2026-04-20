import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function getISOWeekAndYear(date: Date): { week: number; jaar: number } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return { week, jaar: d.getFullYear() }
}

Deno.serve(async (_req) => {
  try {
    const { week: huidigeWeek, jaar: huidigJaar } = getISOWeekAndYear(new Date())

    // Idempotentie: check of snapshot voor deze week al bestaat
    const { count } = await supabase
      .from('bezetting_snapshot')
      .select('id', { count: 'exact', head: true })
      .eq('snapshot_week', huidigeWeek)
      .eq('snapshot_jaar', huidigJaar)

    if ((count ?? 0) > 0) {
      return new Response(
        JSON.stringify({ bericht: `Snapshot voor wk${huidigeWeek}/${huidigJaar} bestaat al.` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Haal alle toekomstige bezettingsrijen op (jaar/week >= huidige week)
    const { data: bezettingen, error } = await supabase
      .from('bezetting')
      .select('*')
      .or(`jaar.gt.${huidigJaar},and(jaar.eq.${huidigJaar},week.gte.${huidigeWeek})`)

    if (error) throw error
    if (!bezettingen || bezettingen.length === 0) {
      return new Response(
        JSON.stringify({ bericht: 'Geen bezettingsrijen om te snapshotten.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const snapshots = bezettingen.map(b => ({
      snapshot_week: huidigeWeek,
      snapshot_jaar: huidigJaar,
      consultant_id: b.consultant_id,
      project_id: b.project_id,
      jaar: b.jaar,
      week: b.week,
      uren: b.uren,
    }))

    const { error: insertError } = await supabase
      .from('bezetting_snapshot')
      .insert(snapshots)

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ bericht: `Snapshot aangemaakt: ${snapshots.length} rijen voor wk${huidigeWeek}/${huidigJaar}.` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Snapshot fout:', err)
    return new Response(
      JSON.stringify({ fout: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
