export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CurriculumType =
  | "RO_NATIONAL"
  | "US_COMMON_CORE"
  | "EN_CAMBRIDGE"
  | "US_HOMESCHOOL";

export type SessionLanguage = "ro" | "en";
export type SubscriptionPlan = "trial" | "essential" | "family" | "annual" | "cancelled";
export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "paused";
export type EnergyLevel = "low" | "medium" | "high";
export type SessionType = "new_concept" | "review" | "test" | "exploration" | "free";
export type ReportType = "session" | "weekly" | "monthly";

// ─── Database type (matches Supabase v2 expectations) ─────────────────────────
export interface Database {
  public: {
    Tables: {
      parents: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          language_preference: SessionLanguage;
          subscription_plan: SubscriptionPlan;
          subscription_status: SubscriptionStatus;
          trial_ends_at: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          language_preference?: SessionLanguage;
          subscription_plan?: SubscriptionPlan;
          subscription_status?: SubscriptionStatus;
          trial_ends_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          email?: string;
          name?: string;
          phone?: string | null;
          language_preference?: SessionLanguage;
          subscription_plan?: SubscriptionPlan;
          subscription_status?: SubscriptionStatus;
          trial_ends_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          age: number;
          grade: number;
          curriculum_type: CurriculumType;
          session_language: SessionLanguage;
          atto_color: string;
          atto_name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          age: number;
          grade: number;
          curriculum_type: CurriculumType;
          session_language: SessionLanguage;
          atto_color?: string;
          atto_name?: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          age?: number;
          grade?: number;
          curriculum_type?: CurriculumType;
          session_language?: SessionLanguage;
          atto_color?: string;
          atto_name?: string;
          is_active?: boolean;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      child_profiles: {
        Row: {
          id: string;
          child_id: string;
          learning_visual: number;
          learning_auditory: number;
          learning_logical: number;
          learning_kinesthetic: number;
          passion_sport: number;
          passion_music: number;
          passion_tech: number;
          passion_stories: number;
          passion_animals: number;
          passion_art: number;
          passion_science: number;
          passion_other: Json;
          positive_anchors: string[];
          common_mistakes: Json;
          current_energy: EnergyLevel;
          current_frustration: number;
          current_engagement: number;
          total_sessions: number;
          total_minutes: number;
          streak_days: number;
          last_session_at: string | null;
          updated_at: string;
        };
        Insert: {
          child_id: string;
        };
        Update: {
          learning_visual?: number;
          learning_auditory?: number;
          learning_logical?: number;
          learning_kinesthetic?: number;
          passion_sport?: number;
          passion_music?: number;
          passion_tech?: number;
          passion_stories?: number;
          passion_animals?: number;
          passion_art?: number;
          passion_science?: number;
          passion_other?: Json;
          positive_anchors?: string[];
          common_mistakes?: Json;
          current_energy?: EnergyLevel;
          current_frustration?: number;
          current_engagement?: number;
          total_sessions?: number;
          total_minutes?: number;
          streak_days?: number;
          last_session_at?: string | null;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      sessions: {
        Row: {
          id: string;
          child_id: string;
          subject: string;
          topic: string;
          curriculum_type: CurriculumType;
          session_language: SessionLanguage;
          session_type: SessionType;
          started_at: string;
          ended_at: string | null;
          duration_minutes: number | null;
          questions_asked_by_atto: number;
          direct_answers_given: number;
          reframes_used: number;
          style_switches: number;
          concepts_attempted: string[];
          concepts_mastered_today: string[];
          breaks_taken: number;
          start_energy: EnergyLevel | null;
          end_energy: EnergyLevel | null;
          peak_frustration: number;
          avg_engagement: number;
          passion_signals: Json;
          had_safety_concern: boolean;
          parent_notified: boolean;
          session_completed: boolean;
        };
        Insert: {
          id?: string;
          child_id: string;
          subject: string;
          topic: string;
          curriculum_type: CurriculumType;
          session_language: SessionLanguage;
          session_type?: SessionType;
          start_energy?: EnergyLevel | null;
          end_energy?: EnergyLevel | null;
        };
        Update: {
          ended_at?: string;
          duration_minutes?: number;
          questions_asked_by_atto?: number;
          direct_answers_given?: number;
          peak_frustration?: number;
          avg_engagement?: number;
          had_safety_concern?: boolean;
          parent_notified?: boolean;
          session_completed?: boolean;
          concepts_mastered_today?: string[];
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          role: "atto" | "child";
          content: string;
          audio_url: string | null;
          is_voice_input: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "atto" | "child";
          content: string;
          audio_url?: string | null;
          is_voice_input?: boolean;
          metadata?: Json;
        };
        Update: {
          content?: string;
          audio_url?: string | null;
          metadata?: Json;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      parent_reports: {
        Row: {
          id: string;
          child_id: string;
          session_id: string | null;
          report_date: string;
          report_type: ReportType;
          summary: string;
          concepts_learned: string[];
          concepts_struggling: string[];
          passions_detected: string[];
          atto_message_to_parent: string | null;
          next_session_recommendation: string | null;
          engagement_score: number | null;
          progress_score: number | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          session_id?: string | null;
          report_date?: string;
          report_type?: ReportType;
          summary: string;
          concepts_learned?: string[];
          concepts_struggling?: string[];
          passions_detected?: string[];
          atto_message_to_parent?: string | null;
          next_session_recommendation?: string | null;
          engagement_score?: number | null;
          progress_score?: number | null;
          is_read?: boolean;
        };
        Update: {
          summary?: string;
          is_read?: boolean;
          atto_message_to_parent?: string | null;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      subscriptions: {
        Row: {
          id: string;
          parent_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          plan: "essential" | "family" | "annual";
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          amount_eur: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          plan: "essential" | "family" | "annual";
          status: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          amount_eur?: number | null;
        };
        Update: {
          plan?: "essential" | "family" | "annual";
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          amount_eur?: number | null;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
