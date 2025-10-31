export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agendamentos_ligacoes: {
        Row: {
          created_at: string
          data_agendamento: string
          google_event_id: string | null
          id: string
          lead_id: string
          observacoes: string | null
          status: string
          synced_with_google: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_agendamento: string
          google_event_id?: string | null
          id?: string
          lead_id: string
          observacoes?: string | null
          status?: string
          synced_with_google?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_agendamento?: string
          google_event_id?: string | null
          id?: string
          lead_id?: string
          observacoes?: string | null
          status?: string
          synced_with_google?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_ligacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      atrasos: {
        Row: {
          Agência: string | null
          Apólice: number
          "Carregado em": string | null
          Celular: number | null
          "Celular Resp.  Pagto.": string | null
          Comentário: string | null
          "Criado Por": string | null
          "Data do Carregamento (Evolução da Lista de Atraso)": string | null
          "Dias  Atraso": number | null
          "E-mail da Assistente": string | null
          "E-mail Resp. Pagto.": string | null
          Emissão: string | null
          "Forma  Pagto.": string | null
          "Histórico de Contatos e Tratativas": string | null
          Joint: string | null
          LP: string | null
          "Melhor Dia": number | null
          "Mês/Ano  Cartão": string | null
          MFB: string | null
          "Pago até": string | null
          "Periodicidade  Pagto.": string | null
          Peristência: string | null
          Prêmio: string | null
          "PRIMEIRO NOME": string | null
          "Resp.  Pagto.": string | null
          Segurado: string | null
          Status: string | null
          "Telefone (Comercial)  Resp. Pagto.": string | null
          "Telefone Resp.  Pagto.": string | null
          "Tratado em": string | null
          "Tratado Por": string | null
          "Última Mensagem Retorno Cobrança Rejeitada": string | null
          user_id: string
          "Vencido Em": string | null
        }
        Insert: {
          Agência?: string | null
          Apólice: number
          "Carregado em"?: string | null
          Celular?: number | null
          "Celular Resp.  Pagto."?: string | null
          Comentário?: string | null
          "Criado Por"?: string | null
          "Data do Carregamento (Evolução da Lista de Atraso)"?: string | null
          "Dias  Atraso"?: number | null
          "E-mail da Assistente"?: string | null
          "E-mail Resp. Pagto."?: string | null
          Emissão?: string | null
          "Forma  Pagto."?: string | null
          "Histórico de Contatos e Tratativas"?: string | null
          Joint?: string | null
          LP?: string | null
          "Melhor Dia"?: number | null
          "Mês/Ano  Cartão"?: string | null
          MFB?: string | null
          "Pago até"?: string | null
          "Periodicidade  Pagto."?: string | null
          Peristência?: string | null
          Prêmio?: string | null
          "PRIMEIRO NOME"?: string | null
          "Resp.  Pagto."?: string | null
          Segurado?: string | null
          Status?: string | null
          "Telefone (Comercial)  Resp. Pagto."?: string | null
          "Telefone Resp.  Pagto."?: string | null
          "Tratado em"?: string | null
          "Tratado Por"?: string | null
          "Última Mensagem Retorno Cobrança Rejeitada"?: string | null
          user_id: string
          "Vencido Em"?: string | null
        }
        Update: {
          Agência?: string | null
          Apólice?: number
          "Carregado em"?: string | null
          Celular?: number | null
          "Celular Resp.  Pagto."?: string | null
          Comentário?: string | null
          "Criado Por"?: string | null
          "Data do Carregamento (Evolução da Lista de Atraso)"?: string | null
          "Dias  Atraso"?: number | null
          "E-mail da Assistente"?: string | null
          "E-mail Resp. Pagto."?: string | null
          Emissão?: string | null
          "Forma  Pagto."?: string | null
          "Histórico de Contatos e Tratativas"?: string | null
          Joint?: string | null
          LP?: string | null
          "Melhor Dia"?: number | null
          "Mês/Ano  Cartão"?: string | null
          MFB?: string | null
          "Pago até"?: string | null
          "Periodicidade  Pagto."?: string | null
          Peristência?: string | null
          Prêmio?: string | null
          "PRIMEIRO NOME"?: string | null
          "Resp.  Pagto."?: string | null
          Segurado?: string | null
          Status?: string | null
          "Telefone (Comercial)  Resp. Pagto."?: string | null
          "Telefone Resp.  Pagto."?: string | null
          "Tratado em"?: string | null
          "Tratado Por"?: string | null
          "Última Mensagem Retorno Cobrança Rejeitada"?: string | null
          user_id?: string
          "Vencido Em"?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          access_token_encrypted: string | null
          calendar_id: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          refresh_token: string
          refresh_token_encrypted: string | null
          sync_enabled: boolean | null
          token_expiry: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          access_token_encrypted?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token: string
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean | null
          token_expiry: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          access_token_encrypted?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean | null
          token_expiry?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_tokens_backup: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string | null
          id: string | null
          last_sync_at: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expiry: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      historico_etapas_funil: {
        Row: {
          created_at: string
          data_mudanca: string
          etapa_anterior: Database["public"]["Enums"]["etapa_funil"] | null
          etapa_nova: Database["public"]["Enums"]["etapa_funil"]
          id: string
          lead_id: string
          observacoes: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_mudanca?: string
          etapa_anterior?: Database["public"]["Enums"]["etapa_funil"] | null
          etapa_nova: Database["public"]["Enums"]["etapa_funil"]
          id?: string
          lead_id: string
          observacoes?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_mudanca?: string
          etapa_anterior?: Database["public"]["Enums"]["etapa_funil"] | null
          etapa_nova?: Database["public"]["Enums"]["etapa_funil"]
          id?: string
          lead_id?: string
          observacoes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_etapas_funil_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          avisado: boolean | null
          casado: boolean | null
          celular_secundario: string | null
          cidade: string | null
          created_at: string | null
          data_callback: string | null
          data_nascimento: string | null
          data_sitplan: string | null
          dias_na_etapa_atual: number | null
          email: string | null
          empresa: string | null
          etapa: Database["public"]["Enums"]["etapa_funil"]
          etapa_changed_at: string | null
          high_ticket: boolean | null
          id: string
          idade: number | null
          incluir_sitplan: boolean | null
          incluir_ta: boolean | null
          nome: string
          observacoes: string | null
          pa_estimado: string | null
          profissao: string | null
          quantidade_filhos: number | null
          recomendante: string[] | null
          renda_estimada: string | null
          status: string | null
          ta_categoria_ativa: string | null
          ta_categoria_valor: string | null
          ta_exclusividade: boolean | null
          ta_order: number | null
          telefone: string | null
          tem_filhos: boolean | null
          updated_at: string | null
          user_id: string
          valor: string | null
        }
        Insert: {
          avisado?: boolean | null
          casado?: boolean | null
          celular_secundario?: string | null
          cidade?: string | null
          created_at?: string | null
          data_callback?: string | null
          data_nascimento?: string | null
          data_sitplan?: string | null
          dias_na_etapa_atual?: number | null
          email?: string | null
          empresa?: string | null
          etapa?: Database["public"]["Enums"]["etapa_funil"]
          etapa_changed_at?: string | null
          high_ticket?: boolean | null
          id?: string
          idade?: number | null
          incluir_sitplan?: boolean | null
          incluir_ta?: boolean | null
          nome: string
          observacoes?: string | null
          pa_estimado?: string | null
          profissao?: string | null
          quantidade_filhos?: number | null
          recomendante?: string[] | null
          renda_estimada?: string | null
          status?: string | null
          ta_categoria_ativa?: string | null
          ta_categoria_valor?: string | null
          ta_exclusividade?: boolean | null
          ta_order?: number | null
          telefone?: string | null
          tem_filhos?: boolean | null
          updated_at?: string | null
          user_id: string
          valor?: string | null
        }
        Update: {
          avisado?: boolean | null
          casado?: boolean | null
          celular_secundario?: string | null
          cidade?: string | null
          created_at?: string | null
          data_callback?: string | null
          data_nascimento?: string | null
          data_sitplan?: string | null
          dias_na_etapa_atual?: number | null
          email?: string | null
          empresa?: string | null
          etapa?: Database["public"]["Enums"]["etapa_funil"]
          etapa_changed_at?: string | null
          high_ticket?: boolean | null
          id?: string
          idade?: number | null
          incluir_sitplan?: boolean | null
          incluir_ta?: boolean | null
          nome?: string
          observacoes?: string | null
          pa_estimado?: string | null
          profissao?: string | null
          quantidade_filhos?: number | null
          recomendante?: string[] | null
          renda_estimada?: string | null
          status?: string | null
          ta_categoria_ativa?: string | null
          ta_categoria_valor?: string | null
          ta_exclusividade?: boolean | null
          ta_order?: number | null
          telefone?: string | null
          tem_filhos?: boolean | null
          updated_at?: string | null
          user_id?: string
          valor?: string | null
        }
        Relationships: []
      }
      ligacoes_historico: {
        Row: {
          created_at: string
          data_ligacao: string
          id: string
          lead_id: string
          observacoes: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_ligacao?: string
          id?: string
          lead_id: string
          observacoes?: string | null
          tipo?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_ligacao?: string
          id?: string
          lead_id?: string
          observacoes?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_config: {
        Row: {
          config_key: string
          config_value: string
          created_at: string
          id: string
          is_compliant: boolean | null
          last_checked_at: string | null
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string
          id?: string
          is_compliant?: boolean | null
          last_checked_at?: string | null
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string
          id?: string
          is_compliant?: boolean | null
          last_checked_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ta_actions: {
        Row: {
          created_at: string
          etapa: string
          id: string
          lead_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          etapa: string
          id?: string
          lead_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          etapa?: string
          id?: string
          lead_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ta_historico: {
        Row: {
          created_at: string
          data_mudanca: string
          etapa_anterior: Database["public"]["Enums"]["etapa_funil"] | null
          etapa_nova: Database["public"]["Enums"]["etapa_funil"]
          id: string
          lead_id: string
          observacoes: string | null
          origem: string | null
          status: string | null
          ta_order_anterior: number | null
          ta_order_nova: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_mudanca?: string
          etapa_anterior?: Database["public"]["Enums"]["etapa_funil"] | null
          etapa_nova: Database["public"]["Enums"]["etapa_funil"]
          id?: string
          lead_id: string
          observacoes?: string | null
          origem?: string | null
          status?: string | null
          ta_order_anterior?: number | null
          ta_order_nova?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_mudanca?: string
          etapa_anterior?: Database["public"]["Enums"]["etapa_funil"] | null
          etapa_nova?: Database["public"]["Enums"]["etapa_funil"]
          id?: string
          lead_id?: string
          observacoes?: string | null
          origem?: string | null
          status?: string | null
          ta_order_anterior?: number | null
          ta_order_nova?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ta_relatorios: {
        Row: {
          created_at: string
          data_relatorio: string
          id: string
          ligacoes_agendadas: number
          ligacoes_atendidas: number
          ligacoes_ligar_depois: number
          ligacoes_marcadas: number
          ligacoes_nao_atendidas: number
          ligacoes_nao_tem_interesse: number
          periodo_fim: string
          periodo_inicio: string
          total_leads: number
          total_ligacoes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_relatorio: string
          id?: string
          ligacoes_agendadas?: number
          ligacoes_atendidas?: number
          ligacoes_ligar_depois?: number
          ligacoes_marcadas?: number
          ligacoes_nao_atendidas?: number
          ligacoes_nao_tem_interesse?: number
          periodo_fim: string
          periodo_inicio: string
          total_leads?: number
          total_ligacoes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_relatorio?: string
          id?: string
          ligacoes_agendadas?: number
          ligacoes_atendidas?: number
          ligacoes_ligar_depois?: number
          ligacoes_marcadas?: number
          ligacoes_nao_atendidas?: number
          ligacoes_nao_tem_interesse?: number
          periodo_fim?: string
          periodo_inicio?: string
          total_leads?: number
          total_ligacoes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tempo_etapas_historico: {
        Row: {
          created_at: string
          data_entrada: string
          data_saida: string | null
          dias_na_etapa: number | null
          etapa: Database["public"]["Enums"]["etapa_funil"]
          id: string
          lead_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_entrada: string
          data_saida?: string | null
          dias_na_etapa?: number | null
          etapa: Database["public"]["Enums"]["etapa_funil"]
          id?: string
          lead_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_entrada?: string
          data_saida?: string | null
          dias_na_etapa?: number | null
          etapa?: Database["public"]["Enums"]["etapa_funil"]
          id?: string
          lead_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test: {
        Row: {
          _RowNumber: number
          AGENDAMENTOS: string | null
          Avisado: string | null
          "Casado(a)": string | null
          Celular: string | null
          "Celular Principal": string | null
          "Celular Secundário ou Número Estrangeiro": string | null
          CelularFormatoWhatsApp: string | null
          "Chance (ANCE)": string | null
          Cidade: string | null
          CONTATOS: string | null
          "Criado Por": string | null
          CriadoEm: string | null
          "Dados Básicos": string | null
          Data_Extraida: string | null
          DDMMYYYY: string | null
          Dias: number | null
          Email: string | null
          "Endereço da Reunião": string | null
          "Etapa Funil": string | null
          Filhos: string | null
          HighTicket: string | null
          Idade: string | null
          Joint: string | null
          "Joint Nome do Usuário": string | null
          "Ligar Depois": string | null
          "Link da Reunião": string | null
          Nome: string | null
          "Nome do SitPlan": string | null
          Observações: string | null
          "PA Estimado": string | null
          Pontuação: string | null
          "Probabilidade (ANCE)": string | null
          Profissão: string | null
          "Proprietário:": string | null
          "Próxima Reunião": string | null
          "Ramo de Atividade": string | null
          "Ranking Semanal": number | null
          Recomendante: string | null
          "Related Agendamentos": string | null
          Renda: string | null
          "Retornar Em (Data)": string | null
          Semana: number | null
          SitPlan: string | null
          SitPlanAction: string | null
          Status: string | null
          "Tipo de Reunião": string | null
          Total_Recomendacoes_Semana: string | null
          Total_Recomendacoes_Semana_Usuario: string | null
          "Última Atualização do Funil": string | null
          "Último Contato": string | null
        }
        Insert: {
          _RowNumber: number
          AGENDAMENTOS?: string | null
          Avisado?: string | null
          "Casado(a)"?: string | null
          Celular?: string | null
          "Celular Principal"?: string | null
          "Celular Secundário ou Número Estrangeiro"?: string | null
          CelularFormatoWhatsApp?: string | null
          "Chance (ANCE)"?: string | null
          Cidade?: string | null
          CONTATOS?: string | null
          "Criado Por"?: string | null
          CriadoEm?: string | null
          "Dados Básicos"?: string | null
          Data_Extraida?: string | null
          DDMMYYYY?: string | null
          Dias?: number | null
          Email?: string | null
          "Endereço da Reunião"?: string | null
          "Etapa Funil"?: string | null
          Filhos?: string | null
          HighTicket?: string | null
          Idade?: string | null
          Joint?: string | null
          "Joint Nome do Usuário"?: string | null
          "Ligar Depois"?: string | null
          "Link da Reunião"?: string | null
          Nome?: string | null
          "Nome do SitPlan"?: string | null
          Observações?: string | null
          "PA Estimado"?: string | null
          Pontuação?: string | null
          "Probabilidade (ANCE)"?: string | null
          Profissão?: string | null
          "Proprietário:"?: string | null
          "Próxima Reunião"?: string | null
          "Ramo de Atividade"?: string | null
          "Ranking Semanal"?: number | null
          Recomendante?: string | null
          "Related Agendamentos"?: string | null
          Renda?: string | null
          "Retornar Em (Data)"?: string | null
          Semana?: number | null
          SitPlan?: string | null
          SitPlanAction?: string | null
          Status?: string | null
          "Tipo de Reunião"?: string | null
          Total_Recomendacoes_Semana?: string | null
          Total_Recomendacoes_Semana_Usuario?: string | null
          "Última Atualização do Funil"?: string | null
          "Último Contato"?: string | null
        }
        Update: {
          _RowNumber?: number
          AGENDAMENTOS?: string | null
          Avisado?: string | null
          "Casado(a)"?: string | null
          Celular?: string | null
          "Celular Principal"?: string | null
          "Celular Secundário ou Número Estrangeiro"?: string | null
          CelularFormatoWhatsApp?: string | null
          "Chance (ANCE)"?: string | null
          Cidade?: string | null
          CONTATOS?: string | null
          "Criado Por"?: string | null
          CriadoEm?: string | null
          "Dados Básicos"?: string | null
          Data_Extraida?: string | null
          DDMMYYYY?: string | null
          Dias?: number | null
          Email?: string | null
          "Endereço da Reunião"?: string | null
          "Etapa Funil"?: string | null
          Filhos?: string | null
          HighTicket?: string | null
          Idade?: string | null
          Joint?: string | null
          "Joint Nome do Usuário"?: string | null
          "Ligar Depois"?: string | null
          "Link da Reunião"?: string | null
          Nome?: string | null
          "Nome do SitPlan"?: string | null
          Observações?: string | null
          "PA Estimado"?: string | null
          Pontuação?: string | null
          "Probabilidade (ANCE)"?: string | null
          Profissão?: string | null
          "Proprietário:"?: string | null
          "Próxima Reunião"?: string | null
          "Ramo de Atividade"?: string | null
          "Ranking Semanal"?: number | null
          Recomendante?: string | null
          "Related Agendamentos"?: string | null
          Renda?: string | null
          "Retornar Em (Data)"?: string | null
          Semana?: number | null
          SitPlan?: string | null
          SitPlanAction?: string | null
          Status?: string | null
          "Tipo de Reunião"?: string | null
          Total_Recomendacoes_Semana?: string | null
          Total_Recomendacoes_Semana_Usuario?: string | null
          "Última Atualização do Funil"?: string | null
          "Último Contato"?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      google_calendar_tokens_decrypted: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string | null
          id: string | null
          last_sync_at: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expiry: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: never
          calendar_id?: string | null
          created_at?: string | null
          id?: string | null
          last_sync_at?: string | null
          refresh_token?: never
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: never
          calendar_id?: string | null
          created_at?: string | null
          id?: string | null
          last_sync_at?: string | null
          refresh_token?: never
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_dias_atraso: {
        Args: { data_vencimento: string }
        Returns: number
      }
      decrypt_token: { Args: { encrypted_token: string }; Returns: string }
      encrypt_token: { Args: { token: string }; Returns: string }
      get_birthday_leads: {
        Args: { p_data?: string; p_user_id: string }
        Returns: {
          data_nascimento: string
          id: string
          idade: number
          nome: string
          telefone: string
        }[]
      }
      get_critical_alerts_by_date: {
        Args: { p_date?: string; p_user_id: string }
        Returns: {
          acao_requerida: string
          descricao: string
          due_date: string
          id: string
          lead_id: string
          lead_nome: string
          severidade: string
          tipo_alerta: string
          titulo: string
        }[]
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_daily_activities_by_date: {
        Args: { p_date?: string; p_user_id: string }
        Returns: {
          descricao: string
          etapa: string
          id: string
          lead_id: string
          lead_nome: string
          lead_telefone: string
          prioridade: string
          tempo_estimado: string
          tipo_atividade: string
        }[]
      }
      get_followup_activities_by_date: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: {
          acao_requerida: string
          descricao: string
          due_date: string
          id: string
          lead_id: string
          lead_nome: string
          prioridade: string
          tipo_atividade: string
        }[]
      }
      get_kpi_metrics_by_date_range: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          taxa_conversao_apolice: number
          taxa_conversao_ligacao: number
          taxa_conversao_n: number
          taxa_conversao_oi: number
          taxa_conversao_proposta: number
          total_apolice_emitida: number
          total_ligacoes: number
          total_n_realizado: number
          total_oi_agendados: number
          total_proposta_apresentada: number
          total_rec: number
        }[]
      }
      get_leads_with_metrics: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: {
          leads_atendidos: number
          oi_marcados: number
          recomendacoes: number
          total_leads: number
          virou_n: number
          virou_pc: number
        }[]
      }
      get_scheduled_calls: {
        Args: { p_data?: string; p_user_id: string }
        Returns: {
          data_agendamento: string
          id: string
          lead_id: string
          lead_nome: string
          lead_telefone: string
          observacoes: string
          status: string
        }[]
      }
      get_scheduled_calls_for_today: {
        Args: { p_date: string; p_user_id: string }
        Returns: {
          data_agendamento: string
          horario: string
          id: string
          lead_id: string
          lead_nome: string
          lead_telefone: string
          observacoes: string
          recomendante: string[]
          synced_with_google: boolean
        }[]
      }
      get_security_status: {
        Args: never
        Returns: {
          error_count: number
          has_errors: boolean
          has_warnings: boolean
          warning_count: number
        }[]
      }
      get_ta_dashboard: {
        Args: { p_period?: string; p_user_id: string }
        Returns: {
          agendados: number
          ligar_depois: number
          marcar_whatsapp: number
          nao_atendeu: number
          nao_tem_interesse: number
          total_contactados: number
        }[]
      }
      get_ta_dashboard_by_date_range: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          agendados: number
          ligar_depois: number
          marcar_whatsapp: number
          nao_atendeu: number
          nao_tem_interesse: number
          total_contactados: number
        }[]
      }
      get_ta_efficiency_metrics: {
        Args: { p_period?: string; p_user_id: string }
        Returns: {
          agendados: number
          leads_por_agendamento: number
          taxa_conversao_geral: number
          taxa_conversao_marcar_oi: number
          total_contactados: number
        }[]
      }
      get_ta_efficiency_metrics_by_date_range: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          agendados: number
          leads_por_agendamento: number
          taxa_conversao_geral: number
          taxa_conversao_marcar_oi: number
          total_contactados: number
        }[]
      }
      get_ta_historico: {
        Args: {
          p_end_date?: string
          p_lead_id?: string
          p_limit?: number
          p_start_date?: string
          p_user_id: string
        }
        Returns: {
          data_mudanca: string
          etapa_anterior: Database["public"]["Enums"]["etapa_funil"]
          etapa_nova: Database["public"]["Enums"]["etapa_funil"]
          id: string
          lead_id: string
          lead_nome: string
          observacoes: string
          ta_order_anterior: number
          ta_order_nova: number
        }[]
      }
      get_ta_temporal_data: {
        Args: { p_period?: string; p_user_id: string }
        Returns: {
          date: string
          etapa: string
          total: number
        }[]
      }
      get_ta_temporal_data_by_date_range: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          date: string
          etapa: string
          total: number
        }[]
      }
      get_weekly_recs_stats: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          recs_count: number
          week_label: string
          week_start: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_old_tentativa_leads: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_all_dias_na_etapa: { Args: never; Returns: undefined }
      update_security_compliance: {
        Args: {
          p_config_key: string
          p_config_value?: string
          p_is_compliant: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      etapa_funil:
        | "Todos"
        | "Novo"
        | "TA"
        | "Não atendido"
        | "OI"
        | "Delay OI"
        | "PC"
        | "Delay PC"
        | "N"
        | "Apólice Emitida"
        | "Apólice Entregue"
        | "C2"
        | "Delay C2"
        | "Ligar Depois"
        | "Marcar"
        | "Não"
        | "Proposta Cancelada"
        | "Apólice Cancelada"
        | "Analisando Proposta"
        | "Pendência de UW"
        | "Placed"
        | "Proposta Não Apresentada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      etapa_funil: [
        "Todos",
        "Novo",
        "TA",
        "Não atendido",
        "OI",
        "Delay OI",
        "PC",
        "Delay PC",
        "N",
        "Apólice Emitida",
        "Apólice Entregue",
        "C2",
        "Delay C2",
        "Ligar Depois",
        "Marcar",
        "Não",
        "Proposta Cancelada",
        "Apólice Cancelada",
        "Analisando Proposta",
        "Pendência de UW",
        "Placed",
        "Proposta Não Apresentada",
      ],
    },
  },
} as const
