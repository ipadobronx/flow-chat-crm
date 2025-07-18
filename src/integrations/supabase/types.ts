export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
          "Vencido Em"?: string | null
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
          email: string | null
          empresa: string | null
          etapa: Database["public"]["Enums"]["etapa_funil"]
          etapa_changed_at: string | null
          high_ticket: boolean | null
          id: string
          idade: number | null
          incluir_sitplan: boolean | null
          nome: string
          observacoes: string | null
          pa_estimado: string | null
          profissao: string | null
          recomendante: string[] | null
          renda_estimada: string | null
          status: string | null
          telefone: string | null
          tem_filhos: boolean | null
          updated_at: string | null
          user_id: string | null
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
          email?: string | null
          empresa?: string | null
          etapa?: Database["public"]["Enums"]["etapa_funil"]
          etapa_changed_at?: string | null
          high_ticket?: boolean | null
          id?: string
          idade?: number | null
          incluir_sitplan?: boolean | null
          nome: string
          observacoes?: string | null
          pa_estimado?: string | null
          profissao?: string | null
          recomendante?: string[] | null
          renda_estimada?: string | null
          status?: string | null
          telefone?: string | null
          tem_filhos?: boolean | null
          updated_at?: string | null
          user_id?: string | null
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
          email?: string | null
          empresa?: string | null
          etapa?: Database["public"]["Enums"]["etapa_funil"]
          etapa_changed_at?: string | null
          high_ticket?: boolean | null
          id?: string
          idade?: number | null
          incluir_sitplan?: boolean | null
          nome?: string
          observacoes?: string | null
          pa_estimado?: string | null
          profissao?: string | null
          recomendante?: string[] | null
          renda_estimada?: string | null
          status?: string | null
          telefone?: string | null
          tem_filhos?: boolean | null
          updated_at?: string | null
          user_id?: string | null
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
    }
    Views: {
      atrasos_calculados: {
        Row: {
          Agência: string | null
          Apólice: number | null
          "Carregado em": string | null
          Celular: number | null
          "Celular Resp.  Pagto.": string | null
          Comentário: string | null
          "Criado Por": string | null
          "Data do Carregamento (Evolução da Lista de Atraso)": string | null
          "Dias  Atraso": number | null
          dias_atraso_calculado: number | null
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
          "Vencido Em": string | null
        }
        Insert: {
          Agência?: string | null
          Apólice?: number | null
          "Carregado em"?: string | null
          Celular?: number | null
          "Celular Resp.  Pagto."?: string | null
          Comentário?: string | null
          "Criado Por"?: string | null
          "Data do Carregamento (Evolução da Lista de Atraso)"?: string | null
          "Dias  Atraso"?: number | null
          dias_atraso_calculado?: never
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
          "Vencido Em"?: string | null
        }
        Update: {
          Agência?: string | null
          Apólice?: number | null
          "Carregado em"?: string | null
          Celular?: number | null
          "Celular Resp.  Pagto."?: string | null
          Comentário?: string | null
          "Criado Por"?: string | null
          "Data do Carregamento (Evolução da Lista de Atraso)"?: string | null
          "Dias  Atraso"?: number | null
          dias_atraso_calculado?: never
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
          "Vencido Em"?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_dias_atraso: {
        Args: { data_vencimento: string }
        Returns: number
      }
      move_old_tentativa_leads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
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
      ],
    },
  },
} as const
