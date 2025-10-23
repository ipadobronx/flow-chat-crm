import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, start_date, end_date } = await req.json();

    console.log('🔄 Starting Google Calendar sync for user:', user_id);

    // 1. Buscar token do Google Calendar
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('google_calendar_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', user_id)
      .single();

    if (tokenError || !tokenData?.access_token) {
      console.error('❌ Token not found:', tokenError);
      throw new Error('Token do Google Calendar não encontrado');
    }

    console.log('✅ Token found, fetching events...');

    // 2. Buscar eventos do Google Calendar
    const timeMin = new Date(start_date).toISOString();
    const timeMax = new Date(end_date).toISOString();
    
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('❌ Google Calendar API error:', errorText);
      throw new Error(`Erro ao buscar eventos: ${errorText}`);
    }

    const eventsData = await calendarResponse.json();
    const events = eventsData.items || [];

    console.log(`📅 Found ${events.length} events in Google Calendar`);

    let importedCount = 0;
    let skippedCount = 0;

    // 3. Para cada evento, verificar se já existe no Supabase
    for (const event of events) {
      try {
        const eventDateTime = event.start?.dateTime || event.start?.date;
        if (!eventDateTime) {
          console.log('⏭️ Skipping event without datetime:', event.id);
          skippedCount++;
          continue;
        }

        // Verificar se já existe pelo google_event_id
        const { data: existingByEventId } = await supabaseClient
          .from('agendamentos_ligacoes')
          .select('id')
          .eq('google_event_id', event.id)
          .eq('user_id', user_id)
          .maybeSingle();

        if (existingByEventId) {
          console.log('✓ Event already exists:', event.id);
          skippedCount++;
          continue;
        }

        // Extrair telefone do título ou descrição
        const phoneMatch = (event.summary || event.description || '').match(/\d{10,11}/);
        
        if (!phoneMatch) {
          console.log('⏭️ No phone found in event:', event.summary);
          skippedCount++;
          continue;
        }

        // Buscar lead pelo telefone
        const { data: lead } = await supabaseClient
          .from('leads')
          .select('id, nome')
          .eq('user_id', user_id)
          .or(`telefone.ilike.%${phoneMatch[0]}%,celular_secundario.ilike.%${phoneMatch[0]}%`)
          .maybeSingle();

        if (!lead) {
          console.log('⏭️ No lead found for phone:', phoneMatch[0]);
          skippedCount++;
          continue;
        }

        // Verificar se já existe agendamento para este lead nesta data
        const { data: existingByDateTime } = await supabaseClient
          .from('agendamentos_ligacoes')
          .select('id')
          .eq('lead_id', lead.id)
          .eq('data_agendamento', new Date(eventDateTime).toISOString())
          .maybeSingle();

        if (existingByDateTime) {
          // Atualizar com google_event_id se não tiver
          await supabaseClient
            .from('agendamentos_ligacoes')
            .update({ 
              google_event_id: event.id,
              synced_with_google: true 
            })
            .eq('id', existingByDateTime.id);
          
          console.log('✓ Updated existing appointment with Google event ID:', event.id);
          skippedCount++;
          continue;
        }

        // Criar agendamento
        const { error: insertError } = await supabaseClient
          .from('agendamentos_ligacoes')
          .insert({
            user_id,
            lead_id: lead.id,
            data_agendamento: new Date(eventDateTime).toISOString(),
            observacoes: event.description || event.summary || `Agendamento com ${lead.nome}`,
            status: 'pendente',
            synced_with_google: true,
            google_event_id: event.id
          });

        if (insertError) {
          console.error('❌ Error inserting appointment:', insertError);
          continue;
        }

        console.log('✅ Imported event:', event.summary, 'for lead:', lead.nome);
        importedCount++;

      } catch (eventError) {
        console.error('❌ Error processing event:', event.id, eventError);
        continue;
      }
    }

    console.log(`✨ Sync complete: ${importedCount} imported, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: importedCount,
        skipped: skippedCount,
        total: events.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
