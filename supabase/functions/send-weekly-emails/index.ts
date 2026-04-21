import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://resource-planner.vercel.app'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'

function getISOWeekAndYear(date: Date): { week: number; jaar: number } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return { week, jaar: d.getFullYear() }
}

function weekNaarMaandag(jaar: number, week: number): Date {
  const jan4 = new Date(jaar, 0, 4)
  const jan4dag = jan4.getDay() || 7
  const maandag = new Date(jan4)
  maandag.setDate(jan4.getDate() - jan4dag + 1 + (week - 1) * 7)
  return maandag
}

function getBezettingKleur(pct: number): string {
  if (pct > 100) return '#ede9fe'
  if (pct >= 80) return '#dcfce7'
  if (pct >= 60) return '#fff7ed'
  return '#fef2f2'
}

function getBezettingTekstKleur(pct: number): string {
  if (pct > 100) return '#5b21b6'
  if (pct >= 80) return '#15803d'
  if (pct >= 60) return '#c2410c'
  return '#b91c1c'
}

function formatDatum(d: Date): string {
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function maakEmailHTML(
  consultant: { naam: string; contract_uren: number },
  weken: Array<{
    week: number
    jaar: number
    projecten: Array<{ naam: string; uren: number }>
    totaalUren: number
    beschikbaarUren: number
  }>,
  magicLink: string
): string {
  const tabelRijen = weken.map(w => {
    const maandag = weekNaarMaandag(w.jaar, w.week)
    const vrijdag = new Date(maandag)
    vrijdag.setDate(maandag.getDate() + 4)
    const pct = consultant.contract_uren > 0
      ? Math.round((w.totaalUren / consultant.contract_uren) * 100)
      : 0
    const bgKleur = getBezettingKleur(pct)
    const txtKleur = getBezettingTekstKleur(pct)

    const projectenTekst = w.projecten.length > 0
      ? w.projecten.map(p => `${p.naam} (${p.uren}u)`).join(', ')
      : '—'

    return `
      <tr style="background-color: ${bgKleur};">
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 500;">
          wk${w.week} <span style="color: #6b7280; font-weight: 400; font-size: 12px;">${formatDatum(maandag)} – ${formatDatum(vrijdag)}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 13px;">
          ${projectenTekst}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${txtKleur}; font-weight: 600;">
          ${w.totaalUren}h
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${txtKleur}; font-weight: 600;">
          ${w.beschikbaarUren > 0 ? `${w.beschikbaarUren}h free` : w.beschikbaarUren < 0 ? `${Math.abs(w.beschikbaarUren)}h over` : 'Full'}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${txtKleur}; font-weight: 700;">
          ${pct}%
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background: #2563eb; padding: 24px 28px;">
        <h1 style="margin: 0; color: white; font-size: 20px; font-weight: 700;">Resource Planner</h1>
        <p style="margin: 4px 0 0; color: #bfdbfe; font-size: 14px;">Your weekly overview</p>
      </div>

      <!-- Intro -->
      <div style="padding: 24px 28px 0;">
        <p style="margin: 0 0 8px; color: #111827; font-size: 16px;">Hello ${consultant.naam},</p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Below you'll find your allocation for the next 12 weeks.
          Your contract hours are <strong>${consultant.contract_uren}h/week</strong>.
        </p>
      </div>

      <!-- Tabel -->
      <div style="padding: 16px 28px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Week</th>
              <th style="padding: 10px 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Projects</th>
              <th style="padding: 10px 12px; text-align: center; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Allocated</th>
              <th style="padding: 10px 12px; text-align: center; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Available</th>
              <th style="padding: 10px 12px; text-align: center; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">%</th>
            </tr>
          </thead>
          <tbody>${tabelRijen}</tbody>
        </table>
      </div>

      <!-- Legenda -->
      <div style="padding: 0 28px 16px; display: flex; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 12px; color: #6b7280;">
          <span style="display: inline-block; width: 10px; height: 10px; background: #dcfce7; border-radius: 2px; margin-right: 4px;"></span>≥ 80% allocated
        </span>
        <span style="font-size: 12px; color: #6b7280;">
          <span style="display: inline-block; width: 10px; height: 10px; background: #fff7ed; border-radius: 2px; margin-right: 4px;"></span>60–79%
        </span>
        <span style="font-size: 12px; color: #6b7280;">
          <span style="display: inline-block; width: 10px; height: 10px; background: #fef2f2; border-radius: 2px; margin-right: 4px;"></span>&lt; 60%
        </span>
        <span style="font-size: 12px; color: #6b7280;">
          <span style="display: inline-block; width: 10px; height: 10px; background: #ede9fe; border-radius: 2px; margin-right: 4px;"></span>&gt; 100%
        </span>
      </div>

      <!-- CTA knop -->
      <div style="padding: 8px 28px 28px; text-align: center;">
        <a href="${magicLink}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          View and edit →
        </a>
      </div>

    </div>

    <!-- Footer -->
    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
      You receive this email every Monday · Resource Planner
    </p>
  </div>
</body>
</html>`
}

Deno.serve(async (_req) => {
  try {
    const nu = new Date()
    const { week: huidigeWeek, jaar: huidigJaar } = getISOWeekAndYear(nu)

    // Haal actieve consultants op
    const { data: consultants, error: consErr } = await supabase
      .from('consultants')
      .select('*')
      .eq('actief', true)

    if (consErr) throw consErr
    if (!consultants?.length) {
      return new Response(JSON.stringify({ bericht: 'Geen actieve consultants.' }), { status: 200 })
    }

    // Bouw lijst van komende 12 weken
    const weken: Array<{ week: number; jaar: number }> = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(nu)
      d.setDate(d.getDate() + i * 7)
      weken.push(getISOWeekAndYear(d))
    }

    // Haal alle bezettingen op voor die weken
    const minJaar = Math.min(...weken.map(w => w.jaar))
    const maxJaar = Math.max(...weken.map(w => w.jaar))
    const { data: alleBezettingen } = await supabase
      .from('bezetting')
      .select('*, projecten(naam)')
      .gte('jaar', minJaar)
      .lte('jaar', maxJaar)

    // Haal project namen op
    const { data: projecten } = await supabase.from('projecten').select('id, naam')
    const projectNaam = new Map((projecten ?? []).map(p => [p.id, p.naam]))

    const resultaten: string[] = []

    for (const consultant of consultants) {
      // Bereken weekdata voor deze consultant
      const weekData = weken.map(w => {
        const weekBezetting = (alleBezettingen ?? []).filter(
          b => b.consultant_id === consultant.id && b.jaar === w.jaar && b.week === w.week
        )
        const totaalUren = weekBezetting.reduce((s, b) => s + b.uren, 0)
        const projectenLijst = weekBezetting
          .filter(b => b.uren > 0)
          .map(b => ({ naam: projectNaam.get(b.project_id) ?? b.project_id, uren: b.uren }))

        return {
          week: w.week,
          jaar: w.jaar,
          projecten: projectenLijst,
          totaalUren,
          beschikbaarUren: consultant.contract_uren - totaalUren,
        }
      })

      // Genereer magic link via Supabase Auth Admin
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: consultant.email,
        options: {
          redirectTo: `${SITE_URL}/mijn-week`,
        },
      })

      if (linkErr) {
        console.error(`Magic link fout voor ${consultant.email}:`, linkErr)
        continue
      }

      const magicLink = linkData?.properties?.action_link ?? SITE_URL

      // Stuur email via Resend
      const html = maakEmailHTML(consultant, weekData, magicLink)

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Resource Planner <${FROM_EMAIL}>`,
          to: consultant.email,
          subject: `Your allocation — wk${huidigeWeek} to wk${weken[weken.length - 1].week}`,
          html,
        }),
      })

      if (!emailRes.ok) {
        const err = await emailRes.text()
        console.error(`Email fout voor ${consultant.email}:`, err)
      } else {
        resultaten.push(consultant.email)
      }
    }

    return new Response(
      JSON.stringify({ bericht: `Emails verzonden naar ${resultaten.length} consultants.`, resultaten }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Email functie fout:', err)
    return new Response(
      JSON.stringify({ fout: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
