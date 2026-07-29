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
      balances: {
        Row: {
          investment: number
          main: number
          savings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          investment?: number
          main?: number
          savings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          investment?: number
          main?: number
          savings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          cadence: string | null
          created_at: string
          current: number
          id: string
          metadata: Json | null
          mode: string
          name: string
          status: string
          target: number
          user_id: string
        }
        Insert: {
          cadence?: string | null
          created_at?: string
          current?: number
          id?: string
          metadata?: Json | null
          mode?: string
          name: string
          status?: string
          target: number
          user_id: string
        }
        Update: {
          cadence?: string | null
          created_at?: string
          current?: number
          id?: string
          metadata?: Json | null
          mode?: string
          name?: string
          status?: string
          target?: number
          user_id?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          amount_requested: number
          created_at: string
          id: string
          metadata: Json | null
          purpose: string | null
          status: string
          term_months: number
          user_id: string
        }
        Insert: {
          amount_requested: number
          created_at?: string
          id?: string
          metadata?: Json | null
          purpose?: string | null
          status?: string
          term_months?: number
          user_id: string
        }
        Update: {
          amount_requested?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          purpose?: string | null
          status?: string
          term_months?: number
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          failed_pin_attempts: number
          first_name: string | null
          full_name: string | null
          id: string
          is_locked: boolean
          last_name: string | null
          payment_pin_hash: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          failed_pin_attempts?: number
          first_name?: string | null
          full_name?: string | null
          id: string
          is_locked?: boolean
          last_name?: string | null
          payment_pin_hash?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          failed_pin_attempts?: number
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_locked?: boolean
          last_name?: string | null
          payment_pin_hash?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          asset: string
          closed_at: string | null
          entry_price: number
          exit_price: number | null
          id: string
          opened_at: string
          pnl: number | null
          qty: number
          side: string
          status: string
          user_id: string
        }
        Insert: {
          asset: string
          closed_at?: string | null
          entry_price: number
          exit_price?: number | null
          id?: string
          opened_at?: string
          pnl?: number | null
          qty: number
          side: string
          status?: string
          user_id: string
        }
        Update: {
          asset?: string
          closed_at?: string | null
          entry_price?: number
          exit_price?: number | null
          id?: string
          opened_at?: string
          pnl?: number | null
          qty?: number
          side?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          counterparty: string | null
          created_at: string
          id: string
          metadata: Json | null
          note: string | null
          ref: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          counterparty?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          note?: string | null
          ref?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          counterparty?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          note?: string | null
          ref?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_pin: { Args: { _user: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
