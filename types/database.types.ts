/**
 * Hand-authored to match docs/04-schema.sql. Once the schema is applied to
 * a live project, prefer regenerating from the source of truth:
 *
 *   npx supabase gen types typescript --project-id <project-ref> > types/database.types.ts
 *
 * (or `--local` against `supabase start`). Keep this file's shape in sync
 * with docs/04-schema.sql until then.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      provinces: {
        Row: {
          id: string;
          code: string;
          name_en: string;
          name_kh: string | null;
          geojson_property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name_en: string;
          name_kh?: string | null;
          geojson_property_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["provinces"]["Insert"]>;
        Relationships: [];
      };
      districts: {
        Row: {
          id: string;
          province_id: string;
          name_en: string;
          name_kh: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          province_id: string;
          name_en: string;
          name_kh?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["districts"]["Insert"]>;
        Relationships: [];
      };
      communes: {
        Row: {
          id: string;
          district_id: string;
          name_en: string;
          name_kh: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          district_id: string;
          name_en: string;
          name_kh?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["communes"]["Insert"]>;
        Relationships: [];
      };
      villages: {
        Row: {
          id: string;
          commune_id: string;
          name_en: string;
          name_kh: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          commune_id: string;
          name_en: string;
          name_kh?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["villages"]["Insert"]>;
        Relationships: [];
      };
      selection_cycles: {
        Row: {
          id: string;
          year: number;
          name: string;
          start_date: string;
          end_date: string | null;
          exam_pass_threshold: number;
          status: "planning" | "active" | "closed" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          name: string;
          start_date: string;
          end_date?: string | null;
          exam_pass_threshold?: number;
          status?: "planning" | "active" | "closed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["selection_cycles"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          firebase_uid: string;
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          status: "active" | "suspended" | "invited";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          firebase_uid: string;
          email: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          status?: "active" | "suspended" | "invited";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      roles: {
        Row: { id: string; name: string; description: string | null };
        Insert: { id?: string; name: string; description?: string | null };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role_id: string;
          granted_at: string;
          granted_by: string | null;
        };
        Insert: {
          user_id: string;
          role_id: string;
          granted_at?: string;
          granted_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
        Relationships: [];
      };
      ngo_partners: {
        Row: {
          id: string;
          organization_name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          province_id: string | null;
          district_name: string | null;
          lat: number | null;
          lng: number | null;
          notes: string | null;
          logo_url: string | null;
          outreach_status: "not_contacted" | "contacted" | "in_discussion" | "active_partner" | "inactive";
          last_contacted_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_name: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          province_id?: string | null;
          district_name?: string | null;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          logo_url?: string | null;
          outreach_status?: "not_contacted" | "contacted" | "in_discussion" | "active_partner" | "inactive";
          last_contacted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ngo_partners"]["Insert"]>;
        Relationships: [];
      };
      ngo_projects: {
        Row: {
          id: string;
          ngo_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ngo_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ngo_projects"]["Insert"]>;
        Relationships: [];
      };
      user_ngo_link: {
        Row: { user_id: string; ngo_id: string };
        Insert: { user_id: string; ngo_id: string };
        Update: Partial<Database["public"]["Tables"]["user_ngo_link"]["Insert"]>;
        Relationships: [];
      };
      school_partners: {
        Row: {
          id: string;
          school_name: string;
          principal_name: string | null;
          phone: string | null;
          email: string | null;
          province_id: string | null;
          district_name: string | null;
          lat: number | null;
          lng: number | null;
          logo_url: string | null;
          outreach_status: "not_contacted" | "contacted" | "in_discussion" | "active_partner" | "inactive";
          last_contacted_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_name: string;
          principal_name?: string | null;
          phone?: string | null;
          email?: string | null;
          province_id?: string | null;
          district_name?: string | null;
          lat?: number | null;
          lng?: number | null;
          logo_url?: string | null;
          outreach_status?: "not_contacted" | "contacted" | "in_discussion" | "active_partner" | "inactive";
          last_contacted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["school_partners"]["Insert"]>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          student_global_id: string;
          student_code: string;
          cycle_id: string;
          first_name: string;
          last_name: string;
          gender: "male" | "female" | "other";
          dob: string;
          phone: string | null;
          province_id: string | null;
          district_name: string | null;
          commune_name: string | null;
          village_name: string | null;
          school_id: string | null;
          grade: string | null;
          gpa: number | null;
          english_level: "none" | "beginner" | "intermediate" | "advanced" | null;
          father_name: string | null;
          mother_name: string | null;
          parent_occupation: string | null;
          family_income_monthly: number | null;
          siblings_count: number | null;
          referred_by_ngo_id: string | null;
          status:
            | "registered"
            | "exam_completed"
            | "interview_completed"
            | "home_visit_completed"
            | "committee_review"
            | "selected"
            | "waitlisted"
            | "rejected"
            | "dropped_out";
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          student_global_id?: string;
          student_code: string;
          cycle_id: string;
          first_name: string;
          last_name: string;
          gender: "male" | "female" | "other";
          dob: string;
          phone?: string | null;
          province_id?: string | null;
          district_name?: string | null;
          commune_name?: string | null;
          village_name?: string | null;
          school_id?: string | null;
          grade?: string | null;
          gpa?: number | null;
          english_level?: "none" | "beginner" | "intermediate" | "advanced" | null;
          father_name?: string | null;
          mother_name?: string | null;
          parent_occupation?: string | null;
          family_income_monthly?: number | null;
          siblings_count?: number | null;
          referred_by_ngo_id?: string | null;
          status?:
            | "registered"
            | "exam_completed"
            | "interview_completed"
            | "home_visit_completed"
            | "committee_review"
            | "selected"
            | "waitlisted"
            | "rejected"
            | "dropped_out";
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
        Relationships: [];
      };
      student_documents: {
        Row: {
          id: string;
          student_id: string;
          doc_type: "photo" | "id_card" | "transcript" | "certificate" | "other";
          file_path: string;
          uploaded_by: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          doc_type: "photo" | "id_card" | "transcript" | "certificate" | "other";
          file_path: string;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["student_documents"]["Insert"]>;
        Relationships: [];
      };
      exam_results: {
        Row: {
          id: string;
          student_id: string;
          cycle_id: string;
          math_score: number;
          english_score: number;
          logic_score: number;
          computer_score: number;
          /** Generated column (math+english+logic+computer); read-only. */
          total_score: number;
          rank_in_province: number | null;
          rank_in_cycle: number | null;
          pass_status: "pass" | "fail" | null;
          exam_date: string;
          entered_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          cycle_id: string;
          math_score: number;
          english_score: number;
          logic_score: number;
          computer_score: number;
          rank_in_province?: number | null;
          rank_in_cycle?: number | null;
          pass_status?: "pass" | "fail" | null;
          exam_date?: string;
          entered_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exam_results"]["Insert"]>;
        Relationships: [];
      };
      interviews: {
        Row: {
          id: string;
          student_id: string;
          cycle_id: string;
          communication_score: number | null;
          leadership_score: number | null;
          motivation_score: number | null;
          confidence_score: number | null;
          critical_thinking_score: number | null;
          comments: string | null;
          recommendation:
            | "strongly_recommend"
            | "recommend"
            | "neutral"
            | "not_recommend"
            | null;
          interviewer_id: string | null;
          interview_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          cycle_id: string;
          communication_score?: number | null;
          leadership_score?: number | null;
          motivation_score?: number | null;
          confidence_score?: number | null;
          critical_thinking_score?: number | null;
          comments?: string | null;
          recommendation?:
            | "strongly_recommend"
            | "recommend"
            | "neutral"
            | "not_recommend"
            | null;
          interviewer_id?: string | null;
          interview_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interviews"]["Insert"]>;
        Relationships: [];
      };
      home_visits: {
        Row: {
          id: string;
          student_id: string;
          cycle_id: string;
          visit_number: number;
          house_type: string | null;
          family_income: number | null;
          transportation: string | null;
          electricity_access: boolean;
          internet_access: boolean;
          family_condition_notes: string | null;
          recommendation:
            | "strongly_recommend"
            | "recommend"
            | "neutral"
            | "not_recommend"
            | null;
          visitor_id: string | null;
          visit_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          cycle_id: string;
          visit_number?: number;
          house_type?: string | null;
          family_income?: number | null;
          transportation?: string | null;
          electricity_access?: boolean;
          internet_access?: boolean;
          family_condition_notes?: string | null;
          recommendation?:
            | "strongly_recommend"
            | "recommend"
            | "neutral"
            | "not_recommend"
            | null;
          visitor_id?: string | null;
          visit_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["home_visits"]["Insert"]>;
        Relationships: [];
      };
      home_visit_media: {
        Row: {
          id: string;
          home_visit_id: string;
          media_type: "house_photo" | "family_photo" | "report";
          file_path: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          home_visit_id: string;
          media_type: "house_photo" | "family_photo" | "report";
          file_path: string;
          uploaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["home_visit_media"]["Insert"]>;
        Relationships: [];
      };
      committee_decisions: {
        Row: {
          id: string;
          student_id: string;
          cycle_id: string;
          decision: "selected" | "waitlisted" | "rejected" | null;
          decision_date: string | null;
          approval_status: "pending" | "approved" | "rejected";
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          cycle_id: string;
          decision?: "selected" | "waitlisted" | "rejected" | null;
          decision_date?: string | null;
          approval_status?: "pending" | "approved" | "rejected";
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["committee_decisions"]["Insert"]>;
        Relationships: [];
      };
      committee_notes: {
        Row: {
          id: string;
          committee_decision_id: string;
          author_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          committee_decision_id: string;
          author_id: string;
          note: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["committee_notes"]["Insert"]>;
        Relationships: [];
      };
      ai_summaries: {
        Row: {
          id: string;
          student_id: string;
          summary_type: "profile_summary" | "home_visit_report" | "selection_recommendation";
          content: string;
          model_version: string;
          generated_by: string | null;
          generated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          summary_type: "profile_summary" | "home_visit_report" | "selection_recommendation";
          content: string;
          model_version: string;
          generated_by?: string | null;
          generated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_summaries"]["Insert"]>;
        Relationships: [];
      };
      ai_query_logs: {
        Row: {
          id: string;
          user_id: string | null;
          question: string;
          generated_sql: string;
          row_count: number | null;
          was_executed: boolean;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          question: string;
          generated_sql: string;
          row_count?: number | null;
          was_executed?: boolean;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_query_logs"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          report_type: "province" | "gender" | "selection" | "ngo_performance" | "school_performance";
          format: "pdf" | "xlsx" | "csv";
          params: Json;
          file_path: string | null;
          generated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_type: "province" | "gender" | "selection" | "ngo_performance" | "school_performance";
          format: "pdf" | "xlsx" | "csv";
          params?: Json;
          file_path?: string | null;
          generated_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: "insert" | "update" | "delete" | "soft_delete";
          changed_by: string | null;
          changed_at: string;
          old_data: Json | null;
          new_data: Json | null;
        };
        Insert: {
          id?: string;
          table_name: string;
          record_id: string;
          action: "insert" | "update" | "delete" | "soft_delete";
          changed_by?: string | null;
          changed_at?: string;
          old_data?: Json | null;
          new_data?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      mv_province_stats: {
        Row: {
          cycle_id: string;
          province_id: string;
          province_name: string;
          total_students: number;
          male_students: number;
          female_students: number;
          exam_completed: number;
          interview_completed: number;
          home_visit_completed: number;
          selected_students: number;
        };
        Relationships: [];
      };
    };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
  };
};
