import type { Profile, PersonalityScores } from './types'

// Heuristic compatibility — values & interests dominate; personality nudges; physical
// attributes and proximity are deliberately ignored. The whole point of Luminescence
// is that you cannot see the person, so the matcher cannot weight what they look like.

const VALUES_WEIGHT = 0.55
const INTERESTS_WEIGHT = 0.3
const PERSONALITY_WEIGHT = 0.15

function jaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0
  const A = new Set(a)
  const B = new Set(b)
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  const union = A.size + B.size - inter
  return union === 0 ? 0 : inter / union
}

function personalityAffinity(a: PersonalityScores, b: PersonalityScores): number {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)])
  if (!keys.size) return 0.5
  let total = 0
  for (const k of keys) {
    const av = (a[k as keyof PersonalityScores] ?? 50) / 100
    const bv = (b[k as keyof PersonalityScores] ?? 50) / 100
    total += 1 - Math.abs(av - bv)
  }
  return total / keys.size
}

export interface ScoredCandidate {
  profile: Profile
  score: number
  shared_values: string[]
  shared_interests: string[]
}

export function scoreCandidate(self: Profile, other: Profile): ScoredCandidate {
  const sharedValues = self.values.filter((v) => other.values.includes(v))
  const sharedInterests = self.interests.filter((i) => other.interests.includes(i))
  const valueScore = jaccard(self.values, other.values)
  const interestScore = jaccard(self.interests, other.interests)
  const persoScore = personalityAffinity(self.personality, other.personality)

  const score =
    valueScore * VALUES_WEIGHT +
    interestScore * INTERESTS_WEIGHT +
    persoScore * PERSONALITY_WEIGHT

  return {
    profile: other,
    score: Math.round(score * 100) / 100,
    shared_values: sharedValues,
    shared_interests: sharedInterests,
  }
}

export function rankCandidates(self: Profile, pool: Profile[]): ScoredCandidate[] {
  return pool
    .filter((p) => p.id !== self.id && p.onboarding_complete)
    .filter((p) => isOrientationCompatible(self, p))
    .map((p) => scoreCandidate(self, p))
    .sort((a, b) => b.score - a.score)
}

function isOrientationCompatible(a: Profile, b: Profile): boolean {
  if (!a.seeking || !a.gender || !b.seeking || !b.gender) return true
  const aAcceptsB = a.seeking === 'any' || a.seeking === b.gender
  const bAcceptsA = b.seeking === 'any' || b.seeking === a.gender
  return aAcceptsB && bAcceptsA
}
