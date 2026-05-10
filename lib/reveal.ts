import type { Match, RevealLevel, Profile, PublicProfile } from './types'

export const OUTLINE_THRESHOLD = 50

export function deriveRevealLevel(match: Pick<Match, 'message_count' | 'candle_lit_by_a' | 'candle_lit_by_b'>): RevealLevel {
  if (match.candle_lit_by_a && match.candle_lit_by_b) return 'revealed'
  if (match.message_count >= OUTLINE_THRESHOLD) return 'outline'
  return 'whisper'
}

export function nextRevealCheckpoint(match: Pick<Match, 'message_count' | 'candle_lit_by_a' | 'candle_lit_by_b'>) {
  const level = deriveRevealLevel(match)
  if (level === 'whisper') {
    return {
      label: 'Outline appears in',
      remaining: Math.max(0, OUTLINE_THRESHOLD - match.message_count),
      unit: 'messages',
    }
  }
  if (level === 'outline') {
    return {
      label: 'Both must light the candle',
      remaining: (match.candle_lit_by_a ? 0 : 1) + (match.candle_lit_by_b ? 0 : 1),
      unit: 'candles',
    }
  }
  return { label: 'Fully revealed', remaining: 0, unit: '' }
}

// Strip a profile to whatever the viewer is allowed to see right now.
export function project(profile: Profile, level: RevealLevel): PublicProfile {
  const base: PublicProfile = {
    id: profile.id,
    vibe_title: profile.vibe_title ?? 'A Quiet Presence',
    display_name: level === 'revealed' ? profile.display_name : null,
    bio_short: profile.bio_short,
    age: level === 'whisper' ? null : profile.age,
    city: level === 'whisper' ? null : profile.city,
    values: profile.values,
    interests: profile.interests,
    personality: profile.personality,
  }

  if (level === 'revealed') {
    return {
      ...base,
      hair_color: profile.hair_color,
      eye_color: profile.eye_color,
      height_cm: profile.height_cm,
      body_type: profile.body_type,
      photos: profile.photos,
    }
  }

  if (level === 'outline') {
    return {
      ...base,
      // Outline phase only hints at silhouette traits — no photo URLs leak.
      height_cm: profile.height_cm,
      body_type: profile.body_type,
    }
  }

  return base
}
