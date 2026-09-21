/**
 * Hand-written to match supabase/schema.sql. Once the schema is live, this
 * can be regenerated from the real project with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */
export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          code: string
          round: number
          status: 'collecting_preferences' | 'swiping' | 'top_five' | 'matched' | 'no_match_final'
          /** Full Title[] objects for the current round/shortlist, not just ids — TMDB results aren't in a static catalogue both devices already have. */
          pool: unknown[]
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          round?: number
          status?: 'collecting_preferences' | 'swiping' | 'top_five' | 'matched' | 'no_match_final'
          pool?: unknown[]
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>
        Relationships: []
      }
      preferences: {
        Row: {
          id: string
          session_id: string
          partner: 'A' | 'B'
          moods: string[]
          mood_note: string | null
          languages: string[]
          content_type: 'movies' | 'series'
          min_rating: 6 | 7 | 8 | 9
          eras: string[]
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          partner: 'A' | 'B'
          moods: string[]
          mood_note?: string | null
          languages: string[]
          content_type: 'movies' | 'series'
          min_rating: 6 | 7 | 8 | 9
          eras: string[]
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['preferences']['Insert']>
        Relationships: []
      }
      swipes: {
        Row: {
          id: string
          session_id: string
          partner: 'A' | 'B'
          round: number
          title_id: string
          direction: 'like' | 'pass'
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          partner: 'A' | 'B'
          round?: number
          title_id: string
          direction: 'like' | 'pass'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['swipes']['Insert']>
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          session_id: string
          title_id: string
          title_snapshot: unknown
          round: number
          matched_at: string
          rating: number | null
          rated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          title_id: string
          title_snapshot: unknown
          round: number
          matched_at?: string
          rating?: number | null
          rated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
