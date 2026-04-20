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
      consultants: {
        Row: {
          id: string
          naam: string
          email: string
          functieniveau: string
          contract_uren: number
          actief: boolean
          rol: 'consultant' | 'planner'
        }
        Insert: {
          id?: string
          naam: string
          email: string
          functieniveau: string
          contract_uren?: number
          actief?: boolean
          rol?: 'consultant' | 'planner'
        }
        Update: {
          id?: string
          naam?: string
          email?: string
          functieniveau?: string
          contract_uren?: number
          actief?: boolean
          rol?: 'consultant' | 'planner'
        }
        Relationships: []
      }
      projecten: {
        Row: {
          id: string
          naam: string
          klant: string | null
          startdatum: string | null
          einddatum: string | null
          status: 'actief' | 'afgesloten'
          is_systeem: boolean
        }
        Insert: {
          id?: string
          naam: string
          klant?: string | null
          startdatum?: string | null
          einddatum?: string | null
          status?: 'actief' | 'afgesloten'
          is_systeem?: boolean
        }
        Update: {
          id?: string
          naam?: string
          klant?: string | null
          startdatum?: string | null
          einddatum?: string | null
          status?: 'actief' | 'afgesloten'
          is_systeem?: boolean
        }
        Relationships: []
      }
      bezetting: {
        Row: {
          id: string
          consultant_id: string
          project_id: string
          jaar: number
          week: number
          uren: number
        }
        Insert: {
          id?: string
          consultant_id: string
          project_id: string
          jaar: number
          week: number
          uren?: number
        }
        Update: {
          id?: string
          consultant_id?: string
          project_id?: string
          jaar?: number
          week?: number
          uren?: number
        }
        Relationships: [
          {
            foreignKeyName: 'bezetting_consultant_id_fkey'
            columns: ['consultant_id']
            isOneToOne: false
            referencedRelation: 'consultants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bezetting_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projecten'
            referencedColumns: ['id']
          }
        ]
      }
      bezetting_snapshot: {
        Row: {
          id: string
          snapshot_week: number
          snapshot_jaar: number
          consultant_id: string
          project_id: string
          jaar: number
          week: number
          uren: number
          gemaakt_op: string
        }
        Insert: {
          id?: string
          snapshot_week: number
          snapshot_jaar: number
          consultant_id: string
          project_id: string
          jaar: number
          week: number
          uren: number
          gemaakt_op?: string
        }
        Update: {
          id?: string
          snapshot_week?: number
          snapshot_jaar?: number
          consultant_id?: string
          project_id?: string
          jaar?: number
          week?: number
          uren?: number
          gemaakt_op?: string
        }
        Relationships: []
      }
      bezetting_log: {
        Row: {
          id: string
          bezetting_id: string | null
          oude_uren: number | null
          nieuwe_uren: number | null
          gewijzigd_door: string | null
          gewijzigd_op: string
        }
        Insert: {
          id?: string
          bezetting_id?: string | null
          oude_uren?: number | null
          nieuwe_uren?: number | null
          gewijzigd_door?: string | null
          gewijzigd_op?: string
        }
        Update: {
          id?: string
          bezetting_id?: string | null
          oude_uren?: number | null
          nieuwe_uren?: number | null
          gewijzigd_door?: string | null
          gewijzigd_op?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_mijn_rol: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_mijn_consultant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
