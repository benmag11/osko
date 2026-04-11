import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'exports', 'question-data', 'subjects')

// --- Config ---

// New project Supabase credentials
const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL || 'https://kfirlfvnpmcxvjjzgdez.supabase.co'
const NEW_SUPABASE_SERVICE_ROLE_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY

if (!NEW_SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing NEW_SUPABASE_SERVICE_ROLE_KEY.\n' +
    'Run with: NEW_SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-images.mjs'
  )
  process.exit(1)
}

const BUCKET = 'question-images'
const CONCURRENCY = 10 // parallel upload limit

const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Old Supabase storage URL pattern
const OLD_STORAGE_PATTERN = /^https:\/\/([^.]+)\.supabase\.co\/storage\/v1\/object\/public\/(.+)$/

// --- Helpers ---

/**
 * Extract the storage path from a full Supabase storage URL
 * e.g. "https://abc.supabase.co/storage/v1/object/public/bucket/path/file.jpg"
 *   → "bucket/path/file.jpg"
 */
function extractStoragePath(url) {
  const match = url.match(OLD_STORAGE_PATTERN)
  if (!match) return null
  return match[2] // bucket + path
}

/**
 * Build the new public URL for an uploaded file
 */
function buildNewUrl(storagePath) {
  const projectId = NEW_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
  return `https://${projectId}.supabase.co/storage/v1/object/public/${BUCKET}/${storagePath}`
}

/**
 * Download a file from a public URL, returns ArrayBuffer
 */
async function downloadFile(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`)
  return res.arrayBuffer()
}

/**
 * Upload a file to the new Supabase Storage bucket
 * Returns true if uploaded, false if already exists
 */
async function uploadFile(storagePath, buffer, contentType) {
  const { error } = await newSupabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: false, // skip if already exists
    })

  if (error) {
    // "Duplicate" / "already exists" means we can skip
    if (error.message?.includes('already exists') || error.statusCode === '409' || error.message?.includes('Duplicate')) {
      return false
    }
    throw error
  }
  return true
}

/**
 * Infer content type from URL/path
 */
function inferContentType(url) {
  const lower = url.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg' // default for .jpg/.jpeg and unknown
}

/**
 * Process a batch of URLs with concurrency limit
 */
async function processWithConcurrency(items, fn, limit) {
  const results = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i], i)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// --- Main ---

async function main() {
  console.log('Image migration: Uncooked Storage → New Supabase Storage\n')

  // 1. Collect all unique image URLs from exported JSON files
  const subjectFiles = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
  console.log(`Found ${subjectFiles.length} subject files\n`)

  // Map: oldUrl → storagePath (deduplicates across subjects)
  const imageMap = new Map()

  for (const file of subjectFiles) {
    const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'))

    for (const q of data.questions) {
      // Primary images
      for (const url of [q.question_image_url, q.marking_scheme_image_url]) {
        if (url && url !== 'placeholder' && url.startsWith('http')) {
          const path = extractStoragePath(url)
          if (path) imageMap.set(url, path)
        }
      }

      // Supplementary images
      for (const imgs of [q.supplementary_question_images, q.supplementary_marking_scheme_images]) {
        if (!Array.isArray(imgs)) continue
        for (const img of imgs) {
          if (img.url && img.url.startsWith('http')) {
            const path = extractStoragePath(img.url)
            if (path) imageMap.set(img.url, path)
          }
        }
      }
    }
  }

  console.log(`Found ${imageMap.size} unique images to migrate\n`)

  // 2. Download from old storage and upload to new bucket
  const entries = [...imageMap.entries()] // [oldUrl, storagePath]
  let uploaded = 0
  let skipped = 0
  let failed = 0

  await processWithConcurrency(entries, async ([oldUrl, storagePath], i) => {
    const progress = `[${i + 1}/${entries.length}]`
    try {
      const buffer = await downloadFile(oldUrl)
      const contentType = inferContentType(oldUrl)
      const wasUploaded = await uploadFile(storagePath, buffer, contentType)

      if (wasUploaded) {
        uploaded++
        if (uploaded % 100 === 0) console.log(`${progress} Uploaded ${uploaded} images...`)
      } else {
        skipped++
      }
    } catch (err) {
      failed++
      console.error(`${progress} FAILED ${storagePath}: ${err.message}`)
    }
  }, CONCURRENCY)

  console.log(`\nUpload complete: ${uploaded} uploaded, ${skipped} already existed, ${failed} failed\n`)

  // 3. Rewrite JSON files with new URLs
  console.log('Rewriting JSON files with new URLs...')

  // Build old → new URL mapping
  const urlRewriteMap = new Map()
  for (const [oldUrl, storagePath] of imageMap) {
    urlRewriteMap.set(oldUrl, buildNewUrl(storagePath))
  }

  function rewriteUrl(url) {
    if (!url) return url
    return urlRewriteMap.get(url) || url
  }

  for (const file of subjectFiles) {
    const filePath = join(DATA_DIR, file)
    const data = JSON.parse(readFileSync(filePath, 'utf-8'))
    let rewritten = 0

    for (const q of data.questions) {
      // Primary images
      const oldQ = q.question_image_url
      const oldM = q.marking_scheme_image_url
      q.question_image_url = rewriteUrl(q.question_image_url)
      q.marking_scheme_image_url = rewriteUrl(q.marking_scheme_image_url)
      if (q.question_image_url !== oldQ) rewritten++
      if (q.marking_scheme_image_url !== oldM) rewritten++

      // Supplementary images
      for (const imgs of [q.supplementary_question_images, q.supplementary_marking_scheme_images]) {
        if (!Array.isArray(imgs)) continue
        for (const img of imgs) {
          const oldUrl = img.url
          img.url = rewriteUrl(img.url)
          if (img.url !== oldUrl) rewritten++
        }
      }
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    console.log(`  ${file} — ${rewritten} URLs rewritten`)
  }

  console.log('\nDone! JSON files now reference the new Supabase Storage bucket.')

  if (failed > 0) {
    console.warn(`\n⚠ ${failed} images failed to upload. Re-run the script to retry (existing uploads will be skipped).`)
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
