import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando verificação de leads antigos na etapa "Tentativa"...');

    // Criar cliente Supabase com service_role para operações administrativas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar leads que estão há mais de 30 dias na etapa "Tentativa"
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: leadsToMove, error: selectError } = await supabaseAdmin
      .from('leads')
      .select('id, nome, etapa, etapa_changed_at')
      .eq('etapa', 'Tentativa')
      .lt('etapa_changed_at', thirtyDaysAgo.toISOString());

    if (selectError) {
      console.error('Erro ao buscar leads:', selectError);
      throw selectError;
    }

    console.log(`Encontrados ${leadsToMove?.length || 0} leads para mover de "Tentativa" para "Novo"`);

    if (leadsToMove && leadsToMove.length > 0) {
      // Mover leads de volta para "Novo"
      const { data: updatedLeads, error: updateError } = await supabaseAdmin
        .from('leads')
        .update({
          etapa: 'Novo',
          etapa_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', leadsToMove.map(lead => lead.id))
        .select();

      if (updateError) {
        console.error('Erro ao atualizar leads:', updateError);
        throw updateError;
      }

      console.log(`Movidos ${updatedLeads?.length || 0} leads de "Tentativa" para "Novo":`, 
        leadsToMove.map(lead => `${lead.nome} (ID: ${lead.id})`));

      return new Response(
        JSON.stringify({
          success: true,
          moved_count: updatedLeads?.length || 0,
          moved_leads: leadsToMove.map(lead => ({
            id: lead.id,
            name: lead.nome,
            days_in_tentativa: Math.floor((Date.now() - new Date(lead.etapa_changed_at).getTime()) / (1000 * 60 * 60 * 24))
          }))
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.log('Nenhum lead encontrado para mover');
      
      return new Response(
        JSON.stringify({
          success: true,
          moved_count: 0,
          message: 'Nenhum lead encontrado para mover'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Erro na função:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});