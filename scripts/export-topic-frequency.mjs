import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EXPORTS_DIR = join(__dirname, '..', 'exports')

// --- Supabase client (mirrors src/lib/supabase/admin.ts) ---

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    'Missing env vars. Run with: node --env-file=.env.local scripts/export-topic-frequency.mjs'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// --- CSV helpers ---

function csvEscape(value) {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(fields) {
  return fields.map(csvEscape).join(',')
}

// --- Main ---

async function main() {
  // 1. Fetch all subjects
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('*')
    .order('name')
    .order('level')

  if (subjectsError) {
    console.error('Failed to fetch subjects:', subjectsError.message)
    process.exit(1)
  }

  console.log(`Found ${subjects.length} subjects`)

  // 2. Fetch topic frequency analysis for each subject
  const results = []
  const allYearsSet = new Set()

  for (const subject of subjects) {
    const { data, error } = await supabase.rpc('get_topic_frequency_analysis', {
      p_subject_id: subject.id,
    })

    if (error) {
      console.error(`  Error fetching ${subject.name} (${subject.level}): ${error.message}`)
      continue
    }

    const analysis = data
    if (analysis.all_years) {
      for (const y of analysis.all_years) allYearsSet.add(y)
    }

    const topicCount = analysis.topics?.length ?? 0
    console.log(`  ${subject.name} (${subject.level}): ${topicCount} topics, ${analysis.total_years} years`)

    results.push({ subject, analysis })
  }

  // 3. Build sorted global year list
  const allYears = [...allYearsSet].sort((a, b) => a - b)

  // 4. Build detail CSV
  const detailHeader = csvRow([
    'subject_name',
    'level',
    'topic_name',
    'years_appeared',
    'year_list',
    'last_year',
    'recent_appearances',
  ])

  const detailRows = [detailHeader]

  for (const { subject, analysis } of results) {
    if (!analysis.topics) continue
    for (const topic of analysis.topics) {
      detailRows.push(
        csvRow([
          subject.name,
          subject.level,
          topic.topic_name,
          topic.years_appeared,
          (topic.year_list || []).join('; '),
          topic.last_year,
          topic.recent_appearances,
        ])
      )
    }
  }

  // 5. Build matrix CSV
  const matrixHeader = csvRow(['subject_name', 'level', 'topic_name', ...allYears])
  const matrixRows = [matrixHeader]

  for (const { subject, analysis } of results) {
    if (!analysis.topics) continue
    for (const topic of analysis.topics) {
      const yearSet = new Set(topic.year_list || [])
      const yearCells = allYears.map((y) => (yearSet.has(y) ? 1 : 0))
      matrixRows.push(csvRow([subject.name, subject.level, topic.topic_name, ...yearCells]))
    }
  }

  // 6. Write files
  mkdirSync(EXPORTS_DIR, { recursive: true })

  const detailPath = join(EXPORTS_DIR, 'topic_frequency_detail.csv')
  writeFileSync(detailPath, detailRows.join('\n') + '\n', 'utf-8')
  console.log(`\nWrote ${detailRows.length - 1} rows to ${detailPath}`)

  const matrixPath = join(EXPORTS_DIR, 'topic_year_matrix.csv')
  writeFileSync(matrixPath, matrixRows.join('\n') + '\n', 'utf-8')
  console.log(`Wrote ${matrixRows.length - 1} rows to ${matrixPath}`)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
