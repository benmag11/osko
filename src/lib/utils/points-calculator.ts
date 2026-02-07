import type { Grade, HigherGrade, OrdinaryGrade, UserSubjectWithSubject } from '@/lib/types/database'

// CAO Points Grid - Higher Level
const HIGHER_POINTS: Record<HigherGrade, number> = {
  H1: 100,
  H2: 88,
  H3: 77,
  H4: 66,
  H5: 56,
  H6: 46,
  H7: 37,
  H8: 28,
}

// CAO Points Grid - Ordinary Level
const ORDINARY_POINTS: Record<OrdinaryGrade, number> = {
  O1: 56,
  O2: 46,
  O3: 37,
  O4: 28,
  O5: 20,
  O6: 12,
  O7: 0,
  O8: 0,
}

// Mathematics subject name for bonus detection
const MATHS_SUBJECT_NAMES = ['mathematics', 'maths']

// Higher Maths bonus: +25 points for grades H1-H6
const MATHS_BONUS = 25
const MATHS_BONUS_GRADES: HigherGrade[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']

/**
 * Get the points value for a given grade
 */
export function getPointsForGrade(grade: Grade | string | null): number {
  if (!grade) return 0

  if (grade in HIGHER_POINTS) {
    return HIGHER_POINTS[grade as HigherGrade]
  }
  if (grade in ORDINARY_POINTS) {
    return ORDINARY_POINTS[grade as OrdinaryGrade]
  }
  return 0
}

/**
 * Check if a subject is Mathematics (case-insensitive)
 */
export function isMathsSubject(subjectName: string): boolean {
  const normalizedName = subjectName.toLowerCase()
  return MATHS_SUBJECT_NAMES.some(name => normalizedName === name)
}

/**
 * Check if a grade qualifies for the Higher Maths bonus
 */
export function qualifiesForMathsBonus(grade: Grade | string | null): boolean {
  if (!grade) return false
  return MATHS_BONUS_GRADES.includes(grade as HigherGrade)
}

/**
 * Get the maths bonus for a subject (25 if Higher Maths with H1-H6, else 0)
 */
export function getMathsBonus(
  subjectName: string,
  grade: Grade | string | null
): number {
  if (!isMathsSubject(subjectName)) return 0
  if (!qualifiesForMathsBonus(grade)) return 0
  return MATHS_BONUS
}

/**
 * Get the default grade for a subject level
 */
export function getDefaultGrade(level: 'Higher' | 'Ordinary' | 'Foundation'): Grade {
  return level === 'Higher' ? 'H3' : 'O3'
}

/**
 * Get the effective grade (stored grade or default based on level)
 */
export function getEffectiveGrade(
  storedGrade: string | null,
  level: 'Higher' | 'Ordinary' | 'Foundation'
): Grade {
  if (storedGrade && isValidGrade(storedGrade)) {
    return storedGrade as Grade
  }
  return getDefaultGrade(level)
}

/**
 * Check if a string is a valid grade
 */
export function isValidGrade(grade: string): grade is Grade {
  return grade in HIGHER_POINTS || grade in ORDINARY_POINTS
}

/**
 * Get all valid grades for a level
 */
export function getGradesForLevel(level: 'Higher' | 'Ordinary' | 'Foundation'): Grade[] {
  if (level === 'Higher') {
    return Object.keys(HIGHER_POINTS) as HigherGrade[]
  }
  return Object.keys(ORDINARY_POINTS) as OrdinaryGrade[]
}

/**
 * Navigate to the next grade in a direction
 * @param currentGrade - The current grade
 * @param direction - 'up' to improve (lower number), 'down' to decrease (higher number)
 * @returns The new grade, or the same grade if at boundary
 */
export function getNextGrade(
  currentGrade: Grade | string,
  direction: 'up' | 'down'
): Grade {
  const gradeStr = currentGrade as string
  const prefix = gradeStr[0] as 'H' | 'O'
  const currentNumber = parseInt(gradeStr[1], 10)

  let newNumber: number
  if (direction === 'up') {
    // Better grade = lower number (minimum 1)
    newNumber = Math.max(1, currentNumber - 1)
  } else {
    // Worse grade = higher number (maximum 8)
    newNumber = Math.min(8, currentNumber + 1)
  }

  return `${prefix}${newNumber}` as Grade
}

/**
 * Check if a grade is at the boundary (can't go further in that direction)
 */
export function isAtGradeBoundary(
  grade: Grade | string,
  direction: 'up' | 'down'
): boolean {
  const gradeNumber = parseInt((grade as string)[1], 10)
  if (direction === 'up') {
    return gradeNumber === 1
  }
  return gradeNumber === 8
}

/**
 * Convert a grade when switching between Higher and Ordinary levels
 * Preserves the grade number (O1 → H1, H3 → O3, etc.)
 */
export function convertGradeLevel(
  currentGrade: Grade,
  newLevel: 'Higher' | 'Ordinary'
): Grade {
  const gradeNumber = currentGrade[1] // '1', '2', etc.
  const newPrefix = newLevel === 'Higher' ? 'H' : 'O'
  return `${newPrefix}${gradeNumber}` as Grade
}

/**
 * Subject breakdown for points calculation
 */
export interface SubjectPointsBreakdown {
  subjectId: string
  subjectName: string
  level: 'Higher' | 'Ordinary' | 'Foundation'
  grade: Grade
  basePoints: number
  mathsBonus: number
  totalPoints: number
}

/**
 * Calculate points breakdown for all subjects
 */
export function calculateSubjectsBreakdown(
  userSubjects: UserSubjectWithSubject[]
): SubjectPointsBreakdown[] {
  return userSubjects.map(us => {
    const grade = getEffectiveGrade(us.grade, us.subject.level)
    const basePoints = getPointsForGrade(grade)
    const mathsBonus = getMathsBonus(us.subject.name, grade)

    return {
      subjectId: us.subject_id,
      subjectName: us.subject.name,
      level: us.subject.level,
      grade,
      basePoints,
      mathsBonus,
      totalPoints: basePoints + mathsBonus,
    }
  })
}

/**
 * Points calculation result
 */
export interface PointsCalculationResult {
  breakdown: SubjectPointsBreakdown[]
  allSubjectsTotal: number
  best6Subjects: SubjectPointsBreakdown[]
  best6Total: number
}

/**
 * Calculate total CAO points (best 6 subjects)
 */
export function calculatePoints(
  userSubjects: UserSubjectWithSubject[]
): PointsCalculationResult {
  const breakdown = calculateSubjectsBreakdown(userSubjects)

  // Sort by total points descending to find best 6
  const sortedByPoints = [...breakdown].sort((a, b) => b.totalPoints - a.totalPoints)
  const best6Subjects = sortedByPoints.slice(0, 6)

  const allSubjectsTotal = breakdown.reduce((sum, s) => sum + s.totalPoints, 0)
  const best6Total = best6Subjects.reduce((sum, s) => sum + s.totalPoints, 0)

  return {
    breakdown,
    allSubjectsTotal,
    best6Subjects,
    best6Total,
  }
}
