export interface Database {
  public: {
    Tables: {
      scan_status: {
        Row: {
          scan_id: string
          company_name: string
          domain: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          progress: number
          total_modules: number
          created_at: string
          completed_at: string | null
          tags: string[] | null
        }
        Insert: {
          scan_id: string
          company_name: string
          domain: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          progress?: number
          total_modules?: number
          created_at?: string
          completed_at?: string | null
          tags?: string[] | null
        }
        Update: {
          scan_id?: string
          company_name?: string
          domain?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          progress?: number
          total_modules?: number
          created_at?: string
          completed_at?: string | null
          tags?: string[] | null
        }
      }
      findings: {
        Row: {
          id: string
          created_at: string
          description: string
          scan_id: string
          type: string
          recommendation: string
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          attack_type_code: string
          state: 'AUTOMATED' | 'VERIFIED' | 'FALSE_POSITIVE' | 'DISREGARD' | 'NEED_OWNER_VERIFICATION'
          eal_low: number | null
          eal_ml: number | null
          eal_high: number | null
          eal_daily: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          description: string
          scan_id: string
          type: string
          recommendation: string
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          attack_type_code: string
          state?: 'AUTOMATED' | 'VERIFIED' | 'FALSE_POSITIVE' | 'DISREGARD' | 'NEED_OWNER_VERIFICATION'
          eal_low?: number | null
          eal_ml?: number | null
          eal_high?: number | null
          eal_daily?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          description?: string
          scan_id?: string
          type?: string
          recommendation?: string
          severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          attack_type_code?: string
          state?: 'AUTOMATED' | 'VERIFIED' | 'FALSE_POSITIVE' | 'DISREGARD' | 'NEED_OWNER_VERIFICATION'
          eal_low?: number | null
          eal_ml?: number | null
          eal_high?: number | null
          eal_daily?: number | null
        }
      }
      reports: {
        Row: {
          id: string
          scan_id: string
          company_name: string
          domain: string
          content: string
          report_type: 'threat_snapshot' | 'executive_summary' | 'technical_remediation'
          findings_count: number
          status: 'pending' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          company_name: string
          domain: string
          content: string
          report_type?: 'threat_snapshot' | 'executive_summary' | 'technical_remediation'
          findings_count: number
          status?: 'pending' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          scan_id?: string
          company_name?: string
          domain?: string
          content?: string
          report_type?: 'threat_snapshot' | 'executive_summary' | 'technical_remediation'
          findings_count?: number
          status?: 'pending' | 'completed'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Scan = Database['public']['Tables']['scan_status']['Row']
export type Finding = Database['public']['Tables']['findings']['Row']
export type Report = Database['public']['Tables']['reports']['Row']