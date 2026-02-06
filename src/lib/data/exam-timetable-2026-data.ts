// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ExamSlot {
  id: string
  subjectKey: string // Normalised to match DB subject name
  label: string // Display label e.g. "English, Paper 1"
  levels: ('H' | 'O' | 'F')[]
  date: string // "2026-06-03"
  startTime: string // "09:30"
  endTime: string // "12:20"
  component?: string // "Written" | "Aural" | etc.
}

export interface ExamDay {
  date: string
  dayOfWeek: string
  dayOfMonth: number
  month: string
  slots: ExamSlot[]
  isFreeDay: boolean
}

export interface ExamWeek {
  weekNumber: number
  days: ExamDay[]
}

export interface ExamInsights {
  totalExams: number
  examDays: number
  freeDays: number
  busiestDay: { date: string; label: string; count: number } | null
  firstExam: ExamSlot | null
  lastExam: ExamSlot | null
  morningExams: number
  afternoonExams: number
}

// ─────────────────────────────────────────────
// Subject name mapping: DB name → timetable name(s)
// Only subjects where the names differ need entries
// ─────────────────────────────────────────────

export const DB_TO_TIMETABLE: Record<string, string[]> = {
  'Applied Maths': ['Applied Mathematics'],
  'Art': ['Art, Visual Studies'],
  'Design & Communication Graphics': ['Design and Communication Graphics'],
  'Home Economics': ['Home Economics, Scientific and Social'],
  'Phys-Chem': ['Physics and Chemistry'],
  'Politics and Society': ['Politics & Society'],
}

// Subjects with dates announced separately
export const SEPARATELY_ANNOUNCED: Set<string> = new Set([
  'Computer Science',
  'LCVP',
])

// ─────────────────────────────────────────────
// Static timetable data — parsed from official
// 2026 Leaving Certificate Examination Timetable
// ─────────────────────────────────────────────

export const EXAM_TIMETABLE_2026: ExamSlot[] = [
  // ── Wednesday 3 June ──
  {
    id: 'english-p1',
    subjectKey: 'English',
    label: 'English, Paper 1',
    levels: ['H', 'O'],
    date: '2026-06-03',
    startTime: '09:30',
    endTime: '12:20',
  },
  {
    id: 'home-ec',
    subjectKey: 'Home Economics',
    label: 'Home Economics, Scientific and Social',
    levels: ['H', 'O'],
    date: '2026-06-03',
    startTime: '14:00',
    endTime: '16:30',
  },

  // ── Thursday 4 June ──
  {
    id: 'engineering-o',
    subjectKey: 'Engineering',
    label: 'Engineering',
    levels: ['O'],
    date: '2026-06-04',
    startTime: '09:30',
    endTime: '12:00',
  },
  {
    id: 'engineering-h',
    subjectKey: 'Engineering',
    label: 'Engineering',
    levels: ['H'],
    date: '2026-06-04',
    startTime: '09:30',
    endTime: '12:30',
  },
  {
    id: 'english-p2',
    subjectKey: 'English',
    label: 'English, Paper 2',
    levels: ['H', 'O'],
    date: '2026-06-04',
    startTime: '14:00',
    endTime: '17:20',
  },

  // ── Friday 5 June ──
  {
    id: 'geography',
    subjectKey: 'Geography',
    label: 'Geography',
    levels: ['H', 'O'],
    date: '2026-06-05',
    startTime: '09:30',
    endTime: '12:20',
  },
  {
    id: 'maths-p1',
    subjectKey: 'Mathematics',
    label: 'Mathematics, Paper 1',
    levels: ['H', 'O'],
    date: '2026-06-05',
    startTime: '14:00',
    endTime: '16:30',
  },
  {
    id: 'maths-f',
    subjectKey: 'Mathematics',
    label: 'Mathematics',
    levels: ['F'],
    date: '2026-06-05',
    startTime: '14:00',
    endTime: '16:30',
  },

  // ── Monday 8 June ──
  {
    id: 'maths-p2',
    subjectKey: 'Mathematics',
    label: 'Mathematics, Paper 2',
    levels: ['H', 'O'],
    date: '2026-06-08',
    startTime: '09:30',
    endTime: '12:00',
  },
  {
    id: 'irish-p1-h',
    subjectKey: 'Irish',
    label: 'Irish, Paper 1 (incl. Aural)',
    levels: ['H'],
    date: '2026-06-08',
    startTime: '14:00',
    endTime: '16:20',
  },
  {
    id: 'irish-p1-o',
    subjectKey: 'Irish',
    label: 'Irish, Paper 1 (incl. Aural)',
    levels: ['O'],
    date: '2026-06-08',
    startTime: '14:00',
    endTime: '15:50',
  },
  {
    id: 'irish-f',
    subjectKey: 'Irish',
    label: 'Irish (incl. Aural)',
    levels: ['F'],
    date: '2026-06-08',
    startTime: '14:00',
    endTime: '16:20',
  },

  // ── Tuesday 9 June ──
  {
    id: 'irish-p2-o',
    subjectKey: 'Irish',
    label: 'Irish, Paper 2',
    levels: ['O'],
    date: '2026-06-09',
    startTime: '09:30',
    endTime: '11:50',
  },
  {
    id: 'irish-p2-h',
    subjectKey: 'Irish',
    label: 'Irish, Paper 2',
    levels: ['H'],
    date: '2026-06-09',
    startTime: '09:30',
    endTime: '12:35',
  },
  {
    id: 'biology',
    subjectKey: 'Biology',
    label: 'Biology',
    levels: ['H', 'O'],
    date: '2026-06-09',
    startTime: '14:00',
    endTime: '17:00',
  },

  // ── Wednesday 10 June ──
  {
    id: 'french-written',
    subjectKey: 'French',
    label: 'French — Written',
    levels: ['H', 'O'],
    date: '2026-06-10',
    startTime: '09:30',
    endTime: '12:00',
    component: 'Written',
  },
  {
    id: 'french-aural',
    subjectKey: 'French',
    label: 'French — Aural',
    levels: ['H', 'O'],
    date: '2026-06-10',
    startTime: '12:10',
    endTime: '12:50',
    component: 'Aural',
  },
  {
    id: 'history',
    subjectKey: 'History',
    label: 'History',
    levels: ['H', 'O'],
    date: '2026-06-10',
    startTime: '14:00',
    endTime: '16:50',
  },

  // ── Thursday 11 June ──
  {
    id: 'business-o',
    subjectKey: 'Business',
    label: 'Business',
    levels: ['O'],
    date: '2026-06-11',
    startTime: '09:30',
    endTime: '12:00',
  },
  {
    id: 'business-h',
    subjectKey: 'Business',
    label: 'Business',
    levels: ['H'],
    date: '2026-06-11',
    startTime: '09:30',
    endTime: '12:30',
  },
  {
    id: 'construction-o',
    subjectKey: 'Construction Studies',
    label: 'Construction Studies',
    levels: ['O'],
    date: '2026-06-11',
    startTime: '14:00',
    endTime: '16:30',
  },
  {
    id: 'construction-h',
    subjectKey: 'Construction Studies',
    label: 'Construction Studies',
    levels: ['H'],
    date: '2026-06-11',
    startTime: '14:00',
    endTime: '17:00',
  },

  // ── Friday 12 June ──
  {
    id: 'german-written',
    subjectKey: 'German',
    label: 'German — Written',
    levels: ['H', 'O'],
    date: '2026-06-12',
    startTime: '09:30',
    endTime: '12:00',
    component: 'Written',
  },
  {
    id: 'german-aural',
    subjectKey: 'German',
    label: 'German — Aural',
    levels: ['H', 'O'],
    date: '2026-06-12',
    startTime: '12:10',
    endTime: '12:50',
    component: 'Aural',
  },
  {
    id: 'art',
    subjectKey: 'Art',
    label: 'Art, Visual Studies',
    levels: ['H', 'O'],
    date: '2026-06-12',
    startTime: '14:00',
    endTime: '16:30',
  },

  // ── Monday 15 June ──
  {
    id: 'ag-science',
    subjectKey: 'Agricultural Science',
    label: 'Agricultural Science',
    levels: ['H', 'O'],
    date: '2026-06-15',
    startTime: '14:00',
    endTime: '16:30',
  },

  // ── Tuesday 16 June ──
  {
    id: 'spanish-written',
    subjectKey: 'Spanish',
    label: 'Spanish — Written',
    levels: ['H', 'O'],
    date: '2026-06-16',
    startTime: '09:30',
    endTime: '12:00',
    component: 'Written',
  },
  {
    id: 'spanish-aural',
    subjectKey: 'Spanish',
    label: 'Spanish — Aural',
    levels: ['H', 'O'],
    date: '2026-06-16',
    startTime: '12:10',
    endTime: '12:50',
    component: 'Aural',
  },
  {
    id: 'chemistry',
    subjectKey: 'Chemistry',
    label: 'Chemistry',
    levels: ['H', 'O'],
    date: '2026-06-16',
    startTime: '14:00',
    endTime: '17:00',
  },

  // ── Wednesday 17 June ──
  {
    id: 'physics',
    subjectKey: 'Physics',
    label: 'Physics',
    levels: ['H', 'O'],
    date: '2026-06-17',
    startTime: '09:30',
    endTime: '12:30',
  },
  {
    id: 'phys-chem',
    subjectKey: 'Phys-Chem',
    label: 'Physics and Chemistry',
    levels: ['H', 'O'],
    date: '2026-06-17',
    startTime: '09:30',
    endTime: '12:30',
  },
  {
    id: 'accounting',
    subjectKey: 'Accounting',
    label: 'Accounting',
    levels: ['H', 'O'],
    date: '2026-06-17',
    startTime: '14:00',
    endTime: '17:00',
  },

  // ── Thursday 18 June ──
  {
    id: 'dcg',
    subjectKey: 'Design & Communication Graphics',
    label: 'Design and Communication Graphics',
    levels: ['H', 'O'],
    date: '2026-06-18',
    startTime: '09:30',
    endTime: '12:30',
  },
  {
    id: 'music-listening',
    subjectKey: 'Music',
    label: 'Music — Listening (Core)',
    levels: ['H', 'O'],
    date: '2026-06-18',
    startTime: '13:30',
    endTime: '15:00',
    component: 'Listening (Core)',
  },
  {
    id: 'music-composing',
    subjectKey: 'Music',
    label: 'Music — Composing',
    levels: ['H', 'O'],
    date: '2026-06-18',
    startTime: '15:15',
    endTime: '16:45',
    component: 'Composing',
  },
  {
    id: 'music-elective',
    subjectKey: 'Music',
    label: 'Music — Listening (Elective)',
    levels: ['H'],
    date: '2026-06-18',
    startTime: '17:00',
    endTime: '17:45',
    component: 'Listening (Elective)',
  },

  // ── Friday 19 June ──
  {
    id: 'economics',
    subjectKey: 'Economics',
    label: 'Economics',
    levels: ['H', 'O'],
    date: '2026-06-19',
    startTime: '09:30',
    endTime: '12:00',
  },
  {
    id: 'pe',
    subjectKey: 'Physical Education',
    label: 'Physical Education',
    levels: ['H', 'O'],
    date: '2026-06-19',
    startTime: '14:00',
    endTime: '16:30',
  },

  // ── Monday 22 June ──
  {
    id: 'italian-written',
    subjectKey: 'Italian',
    label: 'Italian — Written',
    levels: ['H', 'O'],
    date: '2026-06-22',
    startTime: '09:30',
    endTime: '12:00',
    component: 'Written',
  },
  {
    id: 'italian-aural',
    subjectKey: 'Italian',
    label: 'Italian — Aural',
    levels: ['H', 'O'],
    date: '2026-06-22',
    startTime: '12:10',
    endTime: '12:50',
    component: 'Aural',
  },
  {
    id: 'classical-studies',
    subjectKey: 'Classical Studies',
    label: 'Classical Studies',
    levels: ['H', 'O'],
    date: '2026-06-22',
    startTime: '14:00',
    endTime: '16:30',
  },
  {
    id: 'technology-o',
    subjectKey: 'Technology',
    label: 'Technology',
    levels: ['O'],
    date: '2026-06-22',
    startTime: '14:00',
    endTime: '16:00',
  },
  {
    id: 'technology-h',
    subjectKey: 'Technology',
    label: 'Technology',
    levels: ['H'],
    date: '2026-06-22',
    startTime: '14:00',
    endTime: '16:30',
  },

  // ── Tuesday 23 June ──
  {
    id: 'japanese-written',
    subjectKey: 'Japanese',
    label: 'Japanese — Written',
    levels: ['H', 'O'],
    date: '2026-06-23',
    startTime: '09:30',
    endTime: '12:00',
    component: 'Written',
  },
  {
    id: 'japanese-aural',
    subjectKey: 'Japanese',
    label: 'Japanese — Aural',
    levels: ['H', 'O'],
    date: '2026-06-23',
    startTime: '12:10',
    endTime: '12:50',
    component: 'Aural',
  },
  {
    id: 'politics',
    subjectKey: 'Politics and Society',
    label: 'Politics & Society',
    levels: ['H', 'O'],
    date: '2026-06-23',
    startTime: '09:30',
    endTime: '12:00',
  },
  {
    id: 'religious-ed-o',
    subjectKey: 'Religious Education',
    label: 'Religious Education',
    levels: ['O'],
    date: '2026-06-23',
    startTime: '14:00',
    endTime: '16:00',
  },
  {
    id: 'religious-ed-h',
    subjectKey: 'Religious Education',
    label: 'Religious Education',
    levels: ['H'],
    date: '2026-06-23',
    startTime: '14:00',
    endTime: '16:30',
  },
  {
    id: 'applied-maths',
    subjectKey: 'Applied Maths',
    label: 'Applied Mathematics',
    levels: ['H', 'O'],
    date: '2026-06-23',
    startTime: '14:00',
    endTime: '16:30',
  },
]
