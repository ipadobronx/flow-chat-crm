// Google Calendar & Tasks OAuth Integration - v1.3
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    let action = url.searchParams.get('action');
    
    // Se for POST e não tem action na URL, tentar pegar do body
    if (!action && req.method === 'POST') {
      try {
        const body = await req.clone().json();
        action = body.action || 'sync'; // Default para 'sync' se não especificado
      } catch (e) {
        // Ignorar erro de parse JSON, continua sem action
      }
    }

    // OAuth - Iniciar fluxo
    if (action === 'auth') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      
      console.log('🔍 Verificando credenciais do Google Calendar...');
      console.log('GOOGLE_CLIENT_ID configurado:', !!clientId);
      console.log('GOOGLE_CLIENT_SECRET configurado:', !!clientSecret);
      
      if (!clientId || !clientSecret) {
        console.error('❌ Credenciais do Google Calendar não encontradas!');
        console.error('Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nos Edge Function Secrets');
        return new Response(JSON.stringify({ 
          error: 'Google Calendar não está configurado. Adicione GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nos Edge Function Secrets do Supabase.' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('✅ Credenciais do Google Calendar carregadas com sucesso');
      
      const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-oauth?action=callback`;
      
      // Incluir scope do Calendar E do Tasks
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/tasks'
      ].join(' ');
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', userId);

      return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // OAuth - Callback
    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const userId = url.searchParams.get('state');

      if (!code || !userId) {
        return new Response('Missing code or state', { status: 400 });
      }

      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-oauth?action=callback`;

      // Trocar código por tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        console.error('Token error:', tokens);
        return new Response(`Error: ${tokens.error_description}`, { status: 400 });
      }

      // Salvar tokens no banco
      const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);
      const { error } = await supabase
        .from('google_calendar_tokens')
        .upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: expiryDate.toISOString(),
          sync_enabled: true,
        });

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar configurações' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Página de sucesso que fecha automaticamente
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Conectado com sucesso!</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif;
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .card { 
                background: white; 
                padding: 3rem 2rem; 
                border-radius: 16px; 
                box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
                text-align: center;
                max-width: 400px;
              }
              .success { 
                color: #22c55e; 
                font-size: 64px; 
                margin-bottom: 1rem;
                animation: scaleIn 0.5s ease-out;
              }
              h1 { 
                margin: 0 0 0.5rem; 
                color: #1a1a1a;
                font-size: 24px;
              }
              p { 
                color: #666; 
                margin: 0;
                font-size: 14px;
              }
              @keyframes scaleIn {
                from { transform: scale(0); }
                to { transform: scale(1); }
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="success">✓</div>
              <h1>Google Calendar & Tasks Conectados!</h1>
              <p>Esta janela fechará automaticamente...</p>
            </div>
            <script>
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Helper function para obter/renovar access token
    async function getValidAccessToken(supabase: any, userId: string) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (tokenError || !tokenData) {
        throw new Error('Google Calendar not connected');
      }

      let accessToken = tokenData.access_token;
      
      // Verificar se o token expirou e renovar se necessário
      if (new Date(tokenData.token_expiry) < new Date()) {
        console.log('🔄 Renovando token expirado...');
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            refresh_token: tokenData.refresh_token,
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            grant_type: 'refresh_token',
          }),
        });

        const newTokens = await refreshResponse.json();
        
        if (newTokens.error) {
          console.error('❌ Erro ao renovar token:', newTokens);
          throw new Error('Failed to refresh token');
        }
        
        accessToken = newTokens.access_token;

        await supabase
          .from('google_calendar_tokens')
          .update({
            access_token: newTokens.access_token,
            token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          })
          .eq('user_id', userId);
          
        console.log('✅ Token renovado com sucesso');
      }

      return accessToken;
    }

    // Helper function para autenticar usuário
    async function authenticateUser(req: Request, supabase: any) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        throw new Error('Unauthorized');
      }

      return user;
    }

    // Criar Tarefa no Google Tasks
    if (action === 'create-task' && req.method === 'POST') {
      try {
        const user = await authenticateUser(req, supabase);
        const { title, notes, dueDate } = await req.json();

        if (!title) {
          return new Response(JSON.stringify({ error: 'Title is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const accessToken = await getValidAccessToken(supabase, user.id);

        // Criar tarefa no Google Tasks
        const taskBody: any = {
          title,
          notes: notes || undefined,
        };

        // Se tem data, adicionar como due date (formato RFC 3339)
        if (dueDate) {
          const date = new Date(dueDate);
          // Google Tasks usa apenas a data, não a hora
          taskBody.due = date.toISOString();
        }

        console.log('📝 Criando tarefa no Google Tasks:', taskBody);

        const taskResponse = await fetch(
          'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskBody),
          }
        );

        const taskData = await taskResponse.json();

        if (taskData.error) {
          console.error('❌ Google Tasks API error:', taskData.error);
          return new Response(
            JSON.stringify({ error: 'Erro ao criar tarefa no Google Tasks', details: taskData.error }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        console.log('✅ Tarefa criada com sucesso:', taskData.id);

        return new Response(JSON.stringify({ success: true, taskId: taskData.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('❌ Erro ao criar tarefa:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const status = message === 'Missing authorization' || message === 'Unauthorized' ? 401 : 
                       message === 'Google Calendar not connected' ? 400 : 500;
        return new Response(JSON.stringify({ error: message }), {
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Sincronizar evento específico
    if (action === 'sync' && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { agendamentoId, createTask } = await req.json();

      // Buscar tokens do usuário
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({ error: 'Google Calendar not connected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verificar se o token expirou e renovar se necessário
      let accessToken = tokenData.access_token;
      if (new Date(tokenData.token_expiry) < new Date()) {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            refresh_token: tokenData.refresh_token,
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            grant_type: 'refresh_token',
          }),
        });

        const newTokens = await refreshResponse.json();
        accessToken = newTokens.access_token;

        await supabase
          .from('google_calendar_tokens')
          .update({
            access_token: newTokens.access_token,
            token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          })
          .eq('user_id', user.id);
      }

      // Buscar dados do agendamento
      const { data: agendamento, error: agendError } = await supabase
        .from('agendamentos_ligacoes')
        .select(`
          *,
          leads:lead_id (nome, telefone)
        `)
        .eq('id', agendamentoId)
        .single();

      if (agendError || !agendamento) {
        return new Response(JSON.stringify({ error: 'Agendamento not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const startTime = new Date(agendamento.data_agendamento);
      const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutos

      const event = {
        summary: `Ligação - ${agendamento.leads.nome}`,
        description: `Ligação agendada com ${agendamento.leads.nome}\nTelefone: ${agendamento.leads.telefone}\n${agendamento.observacoes || ''}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
          ],
        },
      };

      // Criar ou atualizar evento no Google Calendar
      let googleEventId = agendamento.google_event_id;
      let calendarResponse;

      if (googleEventId) {
        // Atualizar evento existente
        calendarResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );
      } else {
        // Criar novo evento
        calendarResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );
      }

      const calendarData = await calendarResponse.json();

      if (calendarData.error) {
        console.error('Calendar API error:', calendarData.error);
        return new Response(
          JSON.stringify({ error: 'Erro ao sincronizar com Google Calendar' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Também criar tarefa se solicitado
      let taskId = null;
      if (createTask) {
        console.log('📝 Criando tarefa também...');
        const taskBody = {
          title: `Ligar para ${agendamento.leads.nome}`,
          notes: `Telefone: ${agendamento.leads.telefone}\n${agendamento.observacoes || ''}`,
          due: startTime.toISOString(),
        };

        const taskResponse = await fetch(
          'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskBody),
          }
        );

        const taskData = await taskResponse.json();
        if (!taskData.error) {
          taskId = taskData.id;
          console.log('✅ Tarefa criada:', taskId);
        } else {
          console.error('⚠️ Erro ao criar tarefa (não crítico):', taskData.error);
        }
      }

      // Atualizar agendamento com ID do evento e tarefa
      await supabase
        .from('agendamentos_ligacoes')
        .update({
          google_event_id: calendarData.id,
          synced_with_google: true,
          google_task_id: taskId,
        })
        .eq('id', agendamentoId);

      await supabase
        .from('google_calendar_tokens')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ 
        success: true, 
        eventId: calendarData.id,
        taskId: taskId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Desconectar
    if (action === 'disconnect' && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-calendar-oauth:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
