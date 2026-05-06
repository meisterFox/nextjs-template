// Shared domain types for Luminescence.
// The Database type below is hand-rolled to mirror supabase/schema.sql; regenerate
// with `npx supabase gen types typescript` once you wire up the Supabase CLI.

export type RevealLevel = 'whisper' | 'outline' | 'revealed'

export const VALUE_TAGS = [
  'Honesty',
  'Curiosity',
  'Family',
  'Independence',
  'Spirituality',
  'Ambition',
  'Empathy',
  'Adventure',
  'Stability',
  'Creativity',
  'Humor',
  'Loyalty',
  'Justice',
  'Growth',
] as const

export const INTEREST_TAGS = [
  'Jazz',
  'Vinyl',
  'Cinema',
  'Hiking',
  'Cooking',
  'Wine',
  'Coffee',
  'Books',
  'Poetry',
  'Photography',
  'Travel',
  'Astronomy',
  'Gardening',
  'Painting',
  'Theatre',
  'Tabletop Games',
  'Yoga',
  'Running',
  'Surfing',
  'Climbing',
  'Vintage Fashion',
  'Architecture',
  'Languages',
  'Philosophy',
] as const

export const PERSONALITY_AXES = [
  { key: 'introversion', left: 'Introvert', right: 'Extrovert' },
  { key: 'planner', left: 'Spontaneous', right: 'Planner' },
  { key: 'analytical', left: 'Intuitive', right: 'Analytical' },
  { key: 'idealism', left: 'Pragmatic', right: 'Idealistic' },
  { key: 'morning', left: 'Night Owl', right: 'Morning Bird' },
] as const

export type ValueTag = (typeof VALUE_TAGS)[number]
export type InterestTag = (typeof INTEREST_TAGS)[number]
export type PersonalityKey = (typeof PERSONALITY_AXES)[number]['key']

export type PersonalityScores = Partial<Record<PersonalityKey, number>>

export interface Profile {
  id: string
  display_name: string
  vibe_title: string | null
  age: number | null
  gender: string | null
  seeking: string | null
  city: string | null
  bio_short: string | null
  // Hidden physical descriptors — never sent to other users until reveal:
  hair_color: string | null
  eye_color: string | null
  height_cm: number | null
  body_type: string | null
  ethnicity: string | null
  // Soul-Sync personality:
  values: ValueTag[]
  interests: InterestTag[]
  personality: PersonalityScores
  love_language: string | null
  // Photos are locked until both parties light the candle:
  photos: string[]
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  user_a: string
  user_b: string
  reveal_level: RevealLevel
  candle_lit_by_a: boolean
  candle_lit_by_b: boolean
  message_count: number
  compatibility: number
  created_at: string
  last_message_at: string | null
}

export interface Message {
  id: string
  match_id: string
  sender: string
  body: string
  created_at: string
}

// Public projection of a profile that respects the reveal level.
export interface PublicProfile {
  id: string
  vibe_title: string
  display_name: string | null
  bio_short: string | null
  age: number | null
  city: string | null
  values: ValueTag[]
  interests: InterestTag[]
  personality: PersonalityScores
  // Only populated after mutual reveal:
  hair_color?: string | null
  eye_color?: string | null
  height_cm?: number | null
  body_type?: string | null
  photos?: string[]
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
      }
      matches: {
        Row: Match
        Insert: Partial<Match> & { user_a: string; user_b: string }
        Update: Partial<Match>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Message>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: { reveal_level: RevealLevel }
  }
}
