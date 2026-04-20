import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS })
  }

  try {
    const { naam, email, functieniveau, contract_uren, rol } = await req.json()

    if (!naam || !email || !functieniveau) {
      return new Response(JSON.stringify({ fout: 'naam, email en functieniveau zijn verplicht' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    if (authError) throw authError

    const userId = authData.user.id

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
      await supabase.auth.admin.deleteUser(userId)
      throw consError
    }

    return new Response(
      JSON.stringify({ bericht: `Consultant ${naam} aangemaakt`, id: userId }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Fout bij aanmaken consultant:', err)
    return new Response(
      JSON.stringify({ fout: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
