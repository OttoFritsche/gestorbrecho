// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "jsr:@std/http/server";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js";
import { corsHeaders } from '../_shared/cors.ts'

console.log('Function "submit-interest" up and running!');

// Função para criar o cliente Supabase usando variáveis de ambiente
function getSupabaseClient(req: Request): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('PROJECT_SERVICE_KEY'); 

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and PROJECT_SERVICE_KEY must be set in Edge Function secrets.');
  }

  // Ao usar a service_role key, basta passá-la como o segundo argumento.
  // O cliente Supabase JS é projetado para reconhecê-la e agir com as permissões de service_role,
  // o que inclui bypassar RLS.
  return createClient(supabaseUrl, supabaseServiceKey);
}

serve(async (req: Request) => {
  // Isso é necessário se você quiser que sua função seja acessível de um navegador.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar o método da requisição
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Pegar os dados do corpo da requisição
    const { email, nome_brecho, telefone } = await req.json()

    // Validação básica dos dados recebidos
    if (!email) {
      return new Response(JSON.stringify({ error: 'O campo email é obrigatório.' }), {
        status: 400, // Bad Request
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // Validação simples de formato de email (pode ser mais robusta se necessário)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
       return new Response(JSON.stringify({ error: 'Formato de email inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Usar a função para obter o cliente Supabase (que agora usa a service_role key)
    const supabaseAdmin = getSupabaseClient(req);

    // Inserir os dados na tabela 'leads_interessados'
    const { data, error } = await supabaseAdmin
      .from('leads_interessados')
      .insert([
        { 
          email: email, 
          nome_brecho: nome_brecho, 
          telefone: telefone 
        },
      ])
      .select() // Opcional: para retornar os dados inseridos

    if (error) {
      console.error('Erro ao inserir no Supabase:', error)
      // Tratar erros específicos do Supabase, como email duplicado (constraint unique)
      if (error.code === '23505') { // Código para violação de constraint unique
        return new Response(JSON.stringify({ error: 'Este email já foi registrado.' }), {
          status: 409, // Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ error: 'Erro interno ao registrar interesse.', details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Lead inserido com sucesso:', data)
    return new Response(JSON.stringify({ message: 'Interesse registrado com sucesso!', lead: data }), {
      status: 201, // Created
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro inesperado na função:', err)
    return new Response(JSON.stringify({ error: 'Ocorreu um erro inesperado.', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/submit-interest' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
