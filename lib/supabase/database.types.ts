// Generated TypeScript types for ServiceAI Multi-Language Database Schema
// Task 1.2: Multi-Language Database Schema & Template Storage

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          organization_id: string
          customer_configuration_id: string | null
          call_log_id: string | null
          customer_name: string
          customer_phone: string
          customer_email: string | null
          service_type: string
          scheduled_start_time: string
          scheduled_end_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
          notes: string | null
          confirmation_sent_at: string | null
          reminder_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          customer_configuration_id?: string | null
          call_log_id?: string | null
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          service_type: string
          scheduled_start_time: string
          scheduled_end_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
          notes?: string | null
          confirmation_sent_at?: string | null
          reminder_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          customer_configuration_id?: string | null
          call_log_id?: string | null
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          service_type?: string
          scheduled_start_time?: string
          scheduled_end_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
          notes?: string | null
          confirmation_sent_at?: string | null
          reminder_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_configuration_id_fkey"
            columns: ["customer_configuration_id"]
            isOneToOne: false
            referencedRelation: "customer_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          }
        ]
      }
      call_logs: {
        Row: {
          id: string
          organization_id: string
          customer_configuration_id: string | null
          vapi_call_id: string
          phone_number: string
          start_time: string
          end_time: string | null
          duration_seconds: number | null
          status: string
          detected_language: string
          transcript: string | null
          summary: string | null
          call_outcome: Json | null
          emergency_detected: boolean
          emergency_details: Json | null
          cost: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          customer_configuration_id?: string | null
          vapi_call_id: string
          phone_number: string
          start_time?: string
          end_time?: string | null
          duration_seconds?: number | null
          status: string
          detected_language?: string
          transcript?: string | null
          summary?: string | null
          call_outcome?: Json | null
          emergency_detected?: boolean
          emergency_details?: Json | null
          cost?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          customer_configuration_id?: string | null
          vapi_call_id?: string
          phone_number?: string
          start_time?: string
          end_time?: string | null
          duration_seconds?: number | null
          status?: string
          detected_language?: string
          transcript?: string | null
          summary?: string | null
          call_outcome?: Json | null
          emergency_detected?: boolean
          emergency_details?: Json | null
          cost?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_customer_configuration_id_fkey"
            columns: ["customer_configuration_id"]
            isOneToOne: false
            referencedRelation: "customer_configurations"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_configurations: {
        Row: {
          id: string
          organization_id: string
          industry_template_id: string | null
          primary_language: string
          secondary_languages: string[]
          sms_preferences: Json
          custom_config: Json
          vapi_assistant_id: string | null
          vapi_phone_number: string | null
          twilio_phone_number: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          industry_template_id?: string | null
          primary_language?: string
          secondary_languages?: string[]
          sms_preferences?: Json
          custom_config?: Json
          vapi_assistant_id?: string | null
          vapi_phone_number?: string | null
          twilio_phone_number?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          industry_template_id?: string | null
          primary_language?: string
          secondary_languages?: string[]
          sms_preferences?: Json
          custom_config?: Json
          vapi_assistant_id?: string | null
          vapi_phone_number?: string | null
          twilio_phone_number?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_configurations_industry_template_id_fkey"
            columns: ["industry_template_id"]
            isOneToOne: false
            referencedRelation: "industry_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      industry_templates: {
        Row: {
          id: string
          industry_code: string
          language_code: string
          display_name: string
          template_config: Json
          emergency_patterns: Json
          appointment_types: Json
          required_fields: Json
          sms_templates: Json
          cultural_guidelines: Json
          integration_requirements: Json
          version: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          industry_code: string
          language_code: string
          display_name: string
          template_config: Json
          emergency_patterns: Json
          appointment_types: Json
          required_fields: Json
          sms_templates: Json
          cultural_guidelines: Json
          integration_requirements: Json
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          industry_code?: string
          language_code?: string
          display_name?: string
          template_config?: Json
          emergency_patterns?: Json
          appointment_types?: Json
          required_fields?: Json
          sms_templates?: Json
          cultural_guidelines?: Json
          integration_requirements?: Json
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          is_active: boolean
          invited_by: string | null
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          is_active?: boolean
          invited_by?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          is_active?: boolean
          invited_by?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_settings: {
        Row: {
          organization_id: string
          default_language: string
          supported_languages: string[]
          default_timezone: string
          sms_enabled: boolean
          email_notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          default_language?: string
          supported_languages?: string[]
          default_timezone?: string
          sms_enabled?: boolean
          email_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string
          default_language?: string
          supported_languages?: string[]
          default_timezone?: string
          sms_enabled?: boolean
          email_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          industry_code: string | null
          owner_id: string
          primary_language: string
          timezone: string
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          industry_code?: string | null
          owner_id: string
          primary_language?: string
          timezone?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          industry_code?: string | null
          owner_id?: string
          primary_language?: string
          timezone?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sms_communications: {
        Row: {
          id: string
          organization_id: string
          customer_id: string | null
          phone_number: string
          message_type: string
          direction: 'inbound' | 'outbound'
          language_code: string
          message_content: string
          external_message_id: string | null
          status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received' | 'read'
          sent_at: string | null
          delivered_at: string | null
          received_at: string | null
          read_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          customer_id?: string | null
          phone_number: string
          message_type: string
          direction: 'inbound' | 'outbound'
          language_code?: string
          message_content: string
          external_message_id?: string | null
          status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'received' | 'read'
          sent_at?: string | null
          delivered_at?: string | null
          received_at?: string | null
          read_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          customer_id?: string | null
          phone_number?: string
          message_type?: string
          direction?: 'inbound' | 'outbound'
          language_code?: string
          message_content?: string
          external_message_id?: string | null
          status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'received' | 'read'
          sent_at?: string | null
          delivered_at?: string | null
          received_at?: string | null
          read_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_communications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          preferred_language: string
          timezone: string
          email_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          preferred_language?: string
          timezone?: string
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          preferred_language?: string
          timezone?: string
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_customer_config_details: {
        Args: {
          p_customer_config_id: string
        }
        Returns: {
          config_id: string
          organization_id: string
          industry_template_id: string | null
          primary_language: string
          secondary_languages: string[]
          sms_preferences: Json
          custom_config: Json
          vapi_assistant_id: string | null
          vapi_phone_number: string | null
          twilio_phone_number: string | null
          template_display_name: string | null
          template_industry_code: string | null
          template_language_code: string | null
          template_emergency_patterns: Json | null
          template_appointment_types: Json | null
          template_sms_templates: Json | null
        }[]
      }
      get_organization_appointments: {
        Args: {
          p_organization_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          appointment_id: string
          customer_name: string
          customer_phone: string
          service_type: string
          scheduled_start_time: string
          status: string
        }[]
      }
      get_organization_call_summary: {
        Args: {
          p_organization_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          total_calls: number
          completed_calls: number
          emergency_calls: number
          avg_duration_seconds: number | null
          calls_by_language: Json | null
        }[]
      }
      get_organization_settings: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          organization_id: string
          default_language: string
          supported_languages: string[]
          default_timezone: string
          sms_enabled: boolean
          email_notifications_enabled: boolean
        }[]
      }
      get_organization_sms_summary: {
        Args: {
          p_organization_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          total_sms: number
          outbound_sms: number
          inbound_sms: number
          delivered_sms: number
          failed_sms: number
          sms_by_language: Json | null
        }[]
      }
      get_organization_templates: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          template_id: string
          industry_code: string
          language_code: string
          display_name: string
          template_config: Json
          emergency_patterns: Json
          appointment_types: Json
          required_fields: Json
          sms_templates: Json
          cultural_guidelines: Json
          integration_requirements: Json
          version: number
        }[]
      }
    }
    Enums: {
      appointment_status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
      member_role: 'owner' | 'admin' | 'member'
      sms_direction: 'inbound' | 'outbound'
      sms_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received' | 'read'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type aliases for easier usage
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// Helper types for common operations
export type Organization = Tables<'organizations'>
export type OrganizationSettings = Tables<'organization_settings'>
export type IndustryTemplate = Tables<'industry_templates'>
export type CustomerConfiguration = Tables<'customer_configurations'>
export type SMSCommunication = Tables<'sms_communications'>
export type CallLog = Tables<'call_logs'>
export type Appointment = Tables<'appointments'>
export type UserProfile = Tables<'user_profiles'>

// Function return types
export type OrganizationSettingsResult = Database['public']['Functions']['get_organization_settings']['Returns'][0]
export type OrganizationTemplatesResult = Database['public']['Functions']['get_organization_templates']['Returns'][0]
export type CustomerConfigDetailsResult = Database['public']['Functions']['get_customer_config_details']['Returns'][0]
export type CallSummaryResult = Database['public']['Functions']['get_organization_call_summary']['Returns'][0]
export type SMSSummaryResult = Database['public']['Functions']['get_organization_sms_summary']['Returns'][0]
export type AppointmentsResult = Database['public']['Functions']['get_organization_appointments']['Returns'][0]