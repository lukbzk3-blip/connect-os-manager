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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aparelhos: {
        Row: {
          acessorios: string | null
          cliente_id: string
          cor: string | null
          created_at: string
          data_entrada: string
          defeito_relatado: string | null
          estado_fisico: string | null
          id: string
          imei: string | null
          marca: string
          modelo: string
          numero_serie: string | null
          observacoes: string | null
          senha: string | null
          updated_at: string
        }
        Insert: {
          acessorios?: string | null
          cliente_id: string
          cor?: string | null
          created_at?: string
          data_entrada?: string
          defeito_relatado?: string | null
          estado_fisico?: string | null
          id?: string
          imei?: string | null
          marca: string
          modelo: string
          numero_serie?: string | null
          observacoes?: string | null
          senha?: string | null
          updated_at?: string
        }
        Update: {
          acessorios?: string | null
          cliente_id?: string
          cor?: string | null
          created_at?: string
          data_entrada?: string
          defeito_relatado?: string | null
          estado_fisico?: string | null
          id?: string
          imei?: string | null
          marca?: string
          modelo?: string
          numero_serie?: string | null
          observacoes?: string | null
          senha?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aparelhos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          numero: string | null
          observacoes: string | null
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          id: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          id?: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          id?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          created_at: string
          created_by: string | null
          data: string
          descricao: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          os_id: string | null
          pago: boolean
          tipo: Database["public"]["Enums"]["lanc_tipo"]
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          os_id?: string | null
          pago?: boolean
          tipo: Database["public"]["Enums"]["lanc_tipo"]
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          os_id?: string | null
          pago?: boolean
          tipo?: Database["public"]["Enums"]["lanc_tipo"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          observacao: string | null
          os_id: string | null
          produto_id: string
          quantidade: number
          tipo: Database["public"]["Enums"]["mov_tipo"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          observacao?: string | null
          os_id?: string | null
          produto_id: string
          quantidade: number
          tipo: Database["public"]["Enums"]["mov_tipo"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          observacao?: string | null
          os_id?: string | null
          produto_id?: string
          quantidade?: number
          tipo?: Database["public"]["Enums"]["mov_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          aparelho_id: string | null
          cliente_id: string
          created_at: string
          defeito: string | null
          desconto: number
          diagnostico: string | null
          id: string
          os_id: string | null
          pecas: string | null
          prazo: string | null
          servicos: string | null
          status: Database["public"]["Enums"]["orcamento_status"]
          updated_at: string
          validade: string | null
          valor_final: number
          valor_pecas: number
          valor_servicos: number
        }
        Insert: {
          aparelho_id?: string | null
          cliente_id: string
          created_at?: string
          defeito?: string | null
          desconto?: number
          diagnostico?: string | null
          id?: string
          os_id?: string | null
          pecas?: string | null
          prazo?: string | null
          servicos?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          validade?: string | null
          valor_final?: number
          valor_pecas?: number
          valor_servicos?: number
        }
        Update: {
          aparelho_id?: string | null
          cliente_id?: string
          created_at?: string
          defeito?: string | null
          desconto?: number
          diagnostico?: string | null
          id?: string
          os_id?: string | null
          pecas?: string | null
          prazo?: string | null
          servicos?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          validade?: string | null
          valor_final?: number
          valor_pecas?: number
          valor_servicos?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_aparelho_id_fkey"
            columns: ["aparelho_id"]
            isOneToOne: false
            referencedRelation: "aparelhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          aparelho_id: string | null
          cancelado_em: string | null
          cancelado_por: string | null
          cliente_id: string
          created_at: string
          created_by: string | null
          data_entrada: string
          defeito_relatado: string | null
          desconto: number
          diagnostico: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          motivo_cancelamento: string | null
          numero: number
          observacoes: string | null
          previsao_entrega: string | null
          servico_realizado: string | null
          status: Database["public"]["Enums"]["os_status"]
          tecnico_id: string | null
          tecnico_nome: string | null
          updated_at: string
          valor_mao_obra: number
          valor_pecas: number
          valor_total: number
        }
        Insert: {
          aparelho_id?: string | null
          cancelado_em?: string | null
          cancelado_por?: string | null
          cliente_id: string
          created_at?: string
          created_by?: string | null
          data_entrada?: string
          defeito_relatado?: string | null
          desconto?: number
          diagnostico?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          motivo_cancelamento?: string | null
          numero?: number
          observacoes?: string | null
          previsao_entrega?: string | null
          servico_realizado?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          tecnico_id?: string | null
          tecnico_nome?: string | null
          updated_at?: string
          valor_mao_obra?: number
          valor_pecas?: number
          valor_total?: number
        }
        Update: {
          aparelho_id?: string | null
          cancelado_em?: string | null
          cancelado_por?: string | null
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          data_entrada?: string
          defeito_relatado?: string | null
          desconto?: number
          diagnostico?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          motivo_cancelamento?: string | null
          numero?: number
          observacoes?: string | null
          previsao_entrega?: string | null
          servico_realizado?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          tecnico_id?: string | null
          tecnico_nome?: string | null
          updated_at?: string
          valor_mao_obra?: number
          valor_pecas?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_aparelho_id_fkey"
            columns: ["aparelho_id"]
            isOneToOne: false
            referencedRelation: "aparelhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      os_pecas: {
        Row: {
          created_at: string
          descricao: string
          id: string
          os_id: string
          produto_id: string | null
          quantidade: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          os_id: string
          produto_id?: string | null
          quantidade?: number
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          os_id?: string
          produto_id?: string | null
          quantidade?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_pecas_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_pecas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string | null
          codigo: string | null
          created_at: string
          custo: number
          estoque_minimo: number
          fornecedor: string | null
          id: string
          localizacao: string | null
          marca: string | null
          nome: string
          preco_venda: number
          quantidade: number
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          codigo?: string | null
          created_at?: string
          custo?: number
          estoque_minimo?: number
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          marca?: string | null
          nome: string
          preco_venda?: number
          quantidade?: number
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          codigo?: string | null
          created_at?: string
          custo?: number
          estoque_minimo?: number
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          marca?: string | null
          nome?: string
          preco_venda?: number
          quantidade?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_ativo: { Args: never; Returns: boolean }
      transferir_admin: { Args: { novo_admin: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "funcionario"
      forma_pagamento:
        | "dinheiro"
        | "pix"
        | "debito"
        | "credito"
        | "transferencia"
      lanc_tipo: "entrada" | "saida"
      mov_tipo: "entrada" | "saida" | "ajuste"
      orcamento_status: "aguardando_aprovacao" | "aprovado" | "recusado"
      os_status:
        | "recebido"
        | "em_analise"
        | "aguardando_aprovacao"
        | "aprovado"
        | "em_manutencao"
        | "aguardando_peca"
        | "pronto"
        | "entregue"
        | "cancelado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "funcionario"],
      forma_pagamento: [
        "dinheiro",
        "pix",
        "debito",
        "credito",
        "transferencia",
      ],
      lanc_tipo: ["entrada", "saida"],
      mov_tipo: ["entrada", "saida", "ajuste"],
      orcamento_status: ["aguardando_aprovacao", "aprovado", "recusado"],
      os_status: [
        "recebido",
        "em_analise",
        "aguardando_aprovacao",
        "aprovado",
        "em_manutencao",
        "aguardando_peca",
        "pronto",
        "entregue",
        "cancelado",
      ],
    },
  },
} as const
