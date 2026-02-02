/* ============================================
   Supabase Database 타입 정의

   이 파일은 DB 스키마와 1:1 매핑됩니다.
   supabase/schema.sql 과 동기화 유지할 것.
   ============================================ */

export type Database = {
  public: {
    Tables: {
      /** 사용자 프로필 (시니어 + 보호자) */
      profiles: {
        Row: {
          id: string;
          name: string;
          role: "senior" | "guardian";
          phone: string | null;
          linked_to: string | null; // 보호자 ↔ 시니어 연결
          push_subscription: string | null; // Web Push JSON
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          role: "senior" | "guardian";
          phone?: string | null;
          linked_to?: string | null;
          push_subscription?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          role?: "senior" | "guardian";
          phone?: string | null;
          linked_to?: string | null;
          push_subscription?: string | null;
          updated_at?: string;
        };
      };

      /** 약 정보 */
      medications: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          dosage: string; // "1정", "2캡슐" 등
          description: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          dosage: string;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          dosage?: string;
          description?: string | null;
          image_url?: string | null;
        };
      };

      /** 복약 스케줄 (언제 어떤 약을 먹어야 하는지) */
      medication_schedules: {
        Row: {
          id: string;
          medication_id: string;
          user_id: string;
          scheduled_time: string; // "08:00", "13:00", "20:00"
          label: string; // "아침", "점심", "저녁"
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          medication_id: string;
          user_id: string;
          scheduled_time: string;
          label: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          scheduled_time?: string;
          label?: string;
          is_active?: boolean;
        };
      };

      /** 복약 기록 (실제 복용 로그) */
      medication_logs: {
        Row: {
          id: string;
          schedule_id: string;
          user_id: string;
          medication_id: string;
          status: "taken" | "missed" | "skipped" | "pending";
          scheduled_date: string; // "2026-02-02"
          scheduled_time: string; // "08:00"
          taken_at: string | null; // 실제 복용 시각
          notified_guardian: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          user_id: string;
          medication_id: string;
          status?: "taken" | "missed" | "skipped" | "pending";
          scheduled_date: string;
          scheduled_time: string;
          taken_at?: string | null;
          notified_guardian?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "taken" | "missed" | "skipped" | "pending";
          taken_at?: string | null;
          notified_guardian?: boolean;
          updated_at?: string;
        };
      };
    };
  };
};

/* ============================================
   편의 타입 (컴포넌트에서 사용)
   ============================================ */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Medication = Database["public"]["Tables"]["medications"]["Row"];
export type MedicationSchedule =
  Database["public"]["Tables"]["medication_schedules"]["Row"];
export type MedicationLog =
  Database["public"]["Tables"]["medication_logs"]["Row"];

/** 스케줄 + 약 정보 + 오늘의 로그를 합친 뷰 */
export type ScheduleWithDetails = MedicationSchedule & {
  medication: Medication;
  today_log: MedicationLog | null;
};
