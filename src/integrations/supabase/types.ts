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
      leads: {
        Row: {
          avisado: boolean | null
          casado: boolean | null
          created_at: string | null
          data_callback: string | null
          data_sitplan: string | null
          empresa: string | null
          etapa: Database["public"]["Enums"]["etapa_funil"]
          etapa_changed_at: string | null
          high_ticket: boolean | null
          id: string
          incluir_sitplan: boolean | null
          nome: string
          observacoes: string | null
          pa_estimado: string | null
          profissao: string | null
          recomendante: string | null
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
          created_at?: string | null
          data_callback?: string | null
          data_sitplan?: string | null
          empresa?: string | null
          etapa?: Database["public"]["Enums"]["etapa_funil"]
          etapa_changed_at?: string | null
          high_ticket?: boolean | null
          id?: string
          incluir_sitplan?: boolean | null
          nome: string
          observacoes?: string | null
          pa_estimado?: string | null
          profissao?: string | null
          recomendante?: string | null
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
          created_at?: string | null
          data_callback?: string | null
          data_sitplan?: string | null
          empresa?: string | null
          etapa?: Database["public"]["Enums"]["etapa_funil"]
          etapa_changed_at?: string | null
          high_ticket?: boolean | null
          id?: string
          incluir_sitplan?: boolean | null
          nome?: string
          observacoes?: string | null
          pa_estimado?: string | null
          profissao?: string | null
          recomendante?: string | null
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
      [_ in never]: never
    }
    Functions: {
      move_old_tentativa_leads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      etapa_funil:
        | "Todos"
        | "Novo"
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
        "Não",
        "Proposta Cancelada",
        "Apólice Cancelada",
      ],
    },
  },
} as const
