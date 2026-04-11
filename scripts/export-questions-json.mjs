wwimport { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'exports', 'question-data')

// --- Supabase client ---

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    'Missing env vars. Run with: node --env-file=.env.local scripts/export-questions-json.mjs'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// --- Helpers ---

function writeJson(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

/**
 * Generate a URL-safe slug from a subject — matches Uncooked's generateSlug()
 */
function generateSlug(subject) {
  const name = subject.name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
  if (name === 'lcvp') return 'lcvp'
  return `${name}-${subject.level.toLowerCase()}`
}

/**
 * Fetch all rows from a table, handling Supabase's 1000-row limit
 */
async function fetchAll(table, query = {}) {
  const PAGE_SIZE = 1000
  let allData = []
  let offset = 0

  while (true) {
    let q = supabase.from(table).select(query.select || '*')

    if (query.eq) {
      for (const [col, val] of Object.entries(query.eq)) {
        q = q.eq(col, val)
      }
    }
    if (query.order) {
      for (const o of query.order) {
        q = q.order(o.column, { ascending: o.ascending ?? true })
      }
    }

    q = q.range(offset, offset + PAGE_SIZE - 1)

    const { data, error } = await q
    if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)

    allData = allData.concat(data)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return allData
}

// --- Main ---

async function main() {
  console.log('Exporting question data to JSON...\n')

  // 1. Fetch all subjects
  const subjects = await fetchAll('subjects', {
    order: [
      { column: 'name', ascending: true },
      { column: 'level', ascending: true },
    ],
  })
  console.log(`Found ${subjects.length} subjects`)

  // Write subjects index — lightweight manifest for subject listing/routing
  // Each entry includes slug so the new project can resolve routes without re-computing
  const subjectsIndex = subjects.map(s => ({
    id: s.id,
    name: s.name,
    level: s.level,
    slug: generateSlug(s),
  }))

  writeJson(join(OUTPUT_DIR, 'subjects.json'), subjectsIndex)

  // 2. For each subject, build a single consolidated file
  let totalQuestions = 0
  let totalTopicMappings = 0

  for (const subject of subjects) {
    const slug = generateSlug(subject)
    const label = `${subject.name} (${subject.level})`

    // Fetch topics, topic groups, and questions in parallel
    const [topics, topicGroups, questions] = await Promise.all([
      fetchAll('normal_topics', {
        eq: { subject_id: subject.id },
        order: [{ column: 'name', ascending: true }],
      }),
      fetchAll('normal_topic_groups', {
        eq: { subject_id: subject.id },
        order: [{ column: 'name', ascending: true }],
      }),
      fetchAll('normal_questions', {
        eq: { subject_id: subject.id },
        order: [
          { column: 'year', ascending: false },
          { column: 'paper_number', ascending: true },
          { column: 'question_number', ascending: true },
        ],
      }),
    ])

    // Fetch question-topic mappings in batches
    const questionIds = questions.map(q => q.id)
    const topicLookup = new Map(topics.map(t => [t.id, t.name]))
    const allQuestionTopics = []
    const BATCH_SIZE = 200

    for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
      const batch = questionIds.slice(i, i + BATCH_SIZE)
      const { data, error } = await supabase
        .from('normal_question_topics')
        .select('question_id, topic_id')
        .in('question_id', batch)

      if (error) {
        console.error(`  Error fetching question topics for ${label}: ${error.message}`)
        continue
      }
      allQuestionTopics.push(...data)
    }

    totalTopicMappings += allQuestionTopics.length

    // Build question_id → embedded topics map
    const questionTopicsMap = new Map()
    for (const qt of allQuestionTopics) {
      if (!questionTopicsMap.has(qt.question_id)) {
        questionTopicsMap.set(qt.question_id, [])
      }
      const topicName = topicLookup.get(qt.topic_id)
      if (topicName) {
        questionTopicsMap.get(qt.question_id).push({
          id: qt.topic_id,
          name: topicName,
        })
      }
    }

    // Pre-compute derived filter data
    const years = [...new Set(questions.map(q => q.year))].sort((a, b) => b - a)
    const questionNumbers = [...new Set(
      questions.map(q => q.question_number).filter(n => n != null && n > 0)
    )].sort((a, b) => a - b)

    // Build the consolidated subject file
    const subjectData = {
      subject: {
        id: subject.id,
        name: subject.name,
        level: subject.level,
        slug,
      },

      topics: topics.map(t => ({
        id: t.id,
        name: t.name,
        group_id: t.group_id,
      })),

      topicGroups: topicGroups.map(g => ({
        id: g.id,
        name: g.name,
      })),

      // Pre-computed filter options — no runtime derivation needed
      years,
      questionNumbers,

      questions: questions.map(q => ({
        id: q.id,
        year: q.year,
        paper_number: q.paper_number,
        question_number: q.question_number,
        question_parts: q.question_parts || [],
        exam_type: q.exam_type,
        additional_info: q.additional_info,
        question_image_url: q.question_image_url,
        question_image_width: q.question_image_width,
        question_image_height: q.question_image_height,
        marking_scheme_image_url: q.marking_scheme_image_url,
        marking_scheme_image_width: q.marking_scheme_image_width,
        marking_scheme_image_height: q.marking_scheme_image_height,
        supplementary_question_images: q.supplementary_question_images || [],
        supplementary_marking_scheme_images: q.supplementary_marking_scheme_images || [],
        full_text: q.full_text,
        word_coordinates: q.word_coordinates,
        topics: questionTopicsMap.get(q.id) || [],
      })),
    }

    writeJson(join(OUTPUT_DIR, 'subjects', `${slug}.json`), subjectData)

    totalQuestions += questions.length
    console.log(`  ${slug}.json — ${questions.length} questions, ${topics.length} topics, ${topicGroups.length} groups`)
  }

  console.log(`\nDone! Exported ${totalQuestions} questions with ${totalTopicMappings} topic mappings`)
  console.log(`Output:`)
  console.log(`  ${join(OUTPUT_DIR, 'subjects.json')} — subject index (${subjects.length} entries)`)
  console.log(`  ${join(OUTPUT_DIR, 'subjects/')} — ${subjects.length} consolidated subject files`)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
