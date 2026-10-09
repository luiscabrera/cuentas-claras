export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          archived_at: string | null;
          created_at: string;
          household_id: string;
          icon: string | null;
          id: string;
          name: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          household_id: string;
          icon?: string | null;
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          household_id?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      expenses: {
        Row: {
          amount_cents: number;
          category_id: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          household_id: string;
          id: string;
          merchant_id: string | null;
          note: string | null;
          paid_by: string;
          spent_at: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          category_id: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          household_id: string;
          id?: string;
          merchant_id?: string | null;
          note?: string | null;
          paid_by?: string;
          spent_at?: string;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          category_id?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          household_id?: string;
          id?: string;
          merchant_id?: string | null;
          note?: string | null;
          paid_by?: string;
          spent_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_household_id_category_id_fkey';
            columns: ['household_id', 'category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['household_id', 'id'];
          },
          {
            foreignKeyName: 'expenses_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_household_id_merchant_id_fkey';
            columns: ['household_id', 'merchant_id'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['household_id', 'id'];
          },
          {
            foreignKeyName: 'expenses_household_id_paid_by_fkey';
            columns: ['household_id', 'paid_by'];
            isOneToOne: false;
            referencedRelation: 'household_members';
            referencedColumns: ['household_id', 'user_id'];
          },
        ];
      };
      household_members: {
        Row: {
          display_name: string;
          household_id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          display_name: string;
          household_id: string;
          joined_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          display_name?: string;
          household_id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'household_members_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      households: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          invite_code: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invite_code?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invite_code?: string;
          name?: string;
        };
        Relationships: [];
      };
      merchants: {
        Row: {
          archived_at: string | null;
          created_at: string;
          default_category_id: string | null;
          household_id: string;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          default_category_id?: string | null;
          household_id: string;
          id?: string;
          name: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          default_category_id?: string | null;
          household_id?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'merchants_household_id_default_category_id_fkey';
            columns: ['household_id', 'default_category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['household_id', 'id'];
          },
          {
            foreignKeyName: 'merchants_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      member_paid_totals: {
        Row: {
          currency: string | null;
          expense_count: number | null;
          household_id: string | null;
          paid_cents: number | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: 'expenses_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_household_id_paid_by_fkey';
            columns: ['household_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'household_members';
            referencedColumns: ['household_id', 'user_id'];
          },
        ];
      };
    };
    Functions: {
      create_household: { Args: { p_display_name: string; p_name: string }; Returns: string };
      join_household: { Args: { p_display_name: string; p_invite_code: string }; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
