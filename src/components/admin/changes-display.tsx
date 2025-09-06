'use client'

import type { QuestionUpdatePayload } from '@/lib/types/database'

interface ChangesDisplayProps {
  changes: {
    before: Record<string, unknown>
    after: QuestionUpdatePayload
  }
}

export function ChangesDisplay({ changes }: ChangesDisplayProps) {
  if (!changes?.before || !changes?.after) return null
  
  const formatChanges = () => {
    const changesList: string[] = []
    const { before, after } = changes
    
    // Check year changes
    if (before.year !== after.year) {
      changesList.push(`Year: ${before.year} → ${after.year}`)
    }
    
    // Check paper number changes
    if (before.paper_number !== after.paper_number) {
      const beforePaper = before.paper_number || 'None'
      const afterPaper = after.paper_number || 'None'
      changesList.push(`Paper Number: ${beforePaper} → ${afterPaper}`)
    }
    
    // Check question number changes
    if (before.question_number !== after.question_number) {
      changesList.push(`Question Number: ${before.question_number} → ${after.question_number}`)
    }
    
    // Check exam type changes
    if (before.exam_type !== after.exam_type) {
      changesList.push(`Exam Type: ${before.exam_type} → ${after.exam_type}`)
    }
    
    // Check question parts changes
    const beforePartsArray = before.question_parts as string[] | undefined
    const beforeParts = beforePartsArray?.join(', ') || 'None'
    const afterParts = after.question_parts?.join(', ') || 'None'
    if (beforeParts !== afterParts) {
      changesList.push(`Question Parts: ${beforeParts} → ${afterParts}`)
    }
    
    // Check topic changes
    if (after.topic_ids) {
      const beforeTopicsData = before.question_topics as Array<{ topic_id: string }> | undefined
      const beforeTopics = beforeTopicsData?.map((t) => t.topic_id) || []
      const afterTopics = after.topic_ids || []
      
      const added = afterTopics.filter((id: string) => !beforeTopics.includes(id))
      const removed = beforeTopics.filter((id: string) => !afterTopics.includes(id))
      
      if (added.length > 0 || removed.length > 0) {
        const topicChanges = []
        if (added.length > 0) topicChanges.push(`+${added.length} topics`)
        if (removed.length > 0) topicChanges.push(`-${removed.length} topics`)
        changesList.push(`Topics: ${topicChanges.join(', ')}`)
      }
    }
    
    return changesList
  }
  
  const changesList = formatChanges()
  
  if (changesList.length === 0) return null
  
  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm font-medium">Metadata Changes:</p>
      <ul className="text-sm text-warm-text-muted list-disc list-inside">
        {changesList.map((change, index) => (
          <li key={index}>{change}</li>
        ))}
      </ul>
    </div>
  )
}