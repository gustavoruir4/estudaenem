import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // A AbacatePay envia o secret do webhook como query string na URL cadastrada
  // no painel deles: https://.../webhook-pagamento?webhookSecret=SEU_SECRET
  const url = new URL(req.url)
  const webhookSecret = url.searchParams.get('webhookSecret')

  if (webhookSecret !== Deno.env.get('ABACATEPAY_WEBHOOK_SECRET')) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const { event, data } = body

    // AbacatePay v2 usa checkout.completed
    if (event !== 'checkout.completed') {
      return new Response('ok', { headers: corsHeaders })
    }

    const email = data?.metadata?.email
    const payment_id = data?.id

    if (!email) {
      return new Response('email não encontrado', { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase
      .from('acessos')
      .upsert({
        email,
        status: 'pago',
        payment_id,
        paid_at: new Date().toISOString(),
      }, { onConflict: 'email' })

    // ── Email de confirmação pós-pagamento (via Resend) ──
    try {
      const resendKey = Deno.env.get('RESEND_API_KEY')

      const linkAtivacao = `https://estudaenem-sage.vercel.app/ativar?email=${encodeURIComponent(email)}`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'EstudaENEM <onboarding@resend.dev>',
          to: email,
          subject: 'Seu acesso ao EstudaENEM está pronto!',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
              <h1 style="color: #8B5CF6;">Pagamento confirmado! 🎉</h1>
              <p>Olá! Seu pagamento foi confirmado com sucesso.</p>
              <p>Clique no botão abaixo para criar sua senha e acessar a plataforma:</p>
              <a href="${linkAtivacao}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #8B5CF6; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Ativar minha conta
              </a>
              <p style="color: #666; font-size: 14px;">Se o botão não funcionar, copie e cole este link no navegador:<br>${linkAtivacao}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
              <p style="color: #999; font-size: 12px;">EstudaENEM — Questões reais com explicação por IA</p>
            </div>
          `
        })
      })
    } catch (mailErr) {
      console.error('Erro ao enviar email de confirmação:', mailErr)
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
