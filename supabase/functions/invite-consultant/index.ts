import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { naam, email, functieniveau, contract_uren, rol } = await req.json()

    if (!naam || !email || !functieniveau) {
      return new Response(JSON.stringify({ fout: 'naam, email en functieniveau zijn verplicht' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Maak auth gebruiker aan
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    if (authError) throw authError

    const userId = authData.user.id

    // Maak consultant record aan
    const { error: consError } = await supabase.from('consultants').insert({
      id: userId,
      naam,
      email,
      functieniveau,
      contract_uren: contract_uren ?? 40,
      rol: rol ?? 'consultant',
      actief: true,
    })

    if (consError) {
      // Verwijder auth gebruiker als consultant insert mislukt
      await supabase.auth.admin.deleteUser(userId)
      throw consError
    }

    // Stuur magic link email
    const { error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://resource-planner.vercel.app'}/mijn-week`,
      },
    })

    if (linkError) console.warn('Magic link genereren mislukt:', linkError)

    return new Response(
      JSON.stringify({ bericht: `Consultant ${naam} aangemaakt`, id: userId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Fout bij aanmaken consultant:', err)
    return new Response(
      JSON.stringify({ fout: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
