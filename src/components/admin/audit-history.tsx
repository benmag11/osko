'use client'

import { useState, useEffect } from 'react'
import { getQuestionAuditHistory } from '@/lib/supabase/admin-actions'
import { formatDateTime } from '@/lib/utils/format-date'
import type { QuestionAuditLog, QuestionUpdatePayload, AuditLogChanges, Question, Topic } from '@/lib/types/database'

interface AuditHistoryProps {
  questionId: string
  topics?: Topic[]
}

export function AuditHistory({ questionId, topics = [] }: AuditHistoryProps) {
  const [history, setHistory] = useState<QuestionAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      const data = await getQuestionAuditHistory(questionId)
      setHistory(data)
      setLoading(false)
    }
    
    fetchHistory()
  }, [questionId])
  
  if (loading) {
    return (
      <div>
        <p className="text-sm text-warm-text-muted">Loading change history...</p>
      </div>
    )
  }
  
  if (history.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-3">
      {history.map((entry) => (
          <div 
            key={entry.id} 
            className="border-l-2 border-stone-200 pl-3 py-2 space-y-1"
          >
            <p className="text-xs text-warm-text-muted">
              {formatDateTime(entry.created_at)}
            </p>
            <ChangeSummary changes={entry.changes} action={entry.action} topics={topics} />
          </div>
        ))}
    </div>
  )
}

interface ChangeSummaryProps {
  changes: AuditLogChanges
  action: string
  topics: Topic[]
}

function ChangeSummary({ changes, action, topics }: ChangeSummaryProps) {
  if (action === 'update' && 'before' in changes && 'after' in changes) {
    return <UpdateChanges before={changes.before} after={changes.after} topics={topics} />
  }
  
  if ((action === 'topic_add' || action === 'topic_remove') && 'topicName' in changes) {
    return (
      <p className="text-sm">
        {action === 'topic_add' ? 'Added' : 'Removed'} topic: <span className="font-medium">{changes.topicName}</span>
      </p>
    )
  }
  
  return <p className="text-sm text-warm-text-muted">Change recorded</p>
}

interface UpdateChangesProps {
  before: Partial<Question>
  after: QuestionUpdatePayload
  topics: Topic[]
}

function UpdateChanges({ before, after, topics }: UpdateChangesProps) {
  const changesList: string[] = []
  
  // Check year changes
  if (before.year !== after.year && after.year !== undefined) {
    changesList.push(`Year: ${before.year} → ${after.year}`)
  }
  
  // Check paper number changes
  if (before.paper_number !== after.paper_number && after.paper_number !== undefined) {
    const beforePaper = before.paper_number || 'None'
    const afterPaper = after.paper_number || 'None'
    changesList.push(`Paper: ${beforePaper} → ${afterPaper}`)
  }
  
  // Check question number changes
  if (before.question_number !== after.question_number && after.question_number !== undefined) {
    changesList.push(`Question: ${before.question_number} → ${after.question_number}`)
  }
  
  // Check exam type changes
  if (before.exam_type !== after.exam_type && after.exam_type !== undefined) {
    changesList.push(`Type: ${before.exam_type} → ${after.exam_type}`)
  }
  
  // Check question parts changes
  if (after.question_parts !== undefined) {
    const beforePartsArray = before.question_parts as string[] | undefined
    const beforeParts = beforePartsArray?.join(', ') || 'None'
    const afterParts = after.question_parts?.join(', ') || 'None'
    if (beforeParts !== afterParts) {
      changesList.push(`Parts: ${beforeParts} → ${afterParts}`)
    }
  }
  
  // Check topic changes
  if (after.topic_ids !== undefined) {
    // Create topic map for O(1) name lookups
    const topicMap = new Map(topics.map(t => [t.id, t.name]))
    
    // Extract topic IDs from before state
    const beforeTopicIds: string[] = []
    
    // Handle different formats of topic data in 'before' state
    const questionTopics = before.question_topics as Array<{ topic_id: string }> | undefined
    if (questionTopics && Array.isArray(questionTopics)) {
      // Format from database: [{topic_id: "uuid"}, ...]
      beforeTopicIds.push(...questionTopics.map(qt => qt.topic_id))
    } else if (before.topics && Array.isArray(before.topics)) {
      // Format from joined data: [{id: "uuid", name: "..."}, ...]
      beforeTopicIds.push(...before.topics.map(t => t.id))
    }
    
    const afterTopicIds = after.topic_ids || []
    
    // Find added and removed topic IDs
    const addedIds = afterTopicIds.filter((id: string) => !beforeTopicIds.includes(id))
    const removedIds = beforeTopicIds.filter((id: string) => !afterTopicIds.includes(id))
    
    if (addedIds.length > 0 || removedIds.length > 0) {
      const changes: string[] = []
      
      // Map IDs to names with fallback for deleted topics
      if (addedIds.length > 0) {
        const addedNames = addedIds.map(id => 
          topicMap.get(id) || `Unknown (${id.slice(0, 8)}...)`
        )
        changes.push(`Added '${addedNames.join("', '")}'`)
      }
      
      if (removedIds.length > 0) {
        const removedNames = removedIds.map(id => 
          topicMap.get(id) || `Unknown (${id.slice(0, 8)}...)`
        )
        changes.push(`Removed '${removedNames.join("', '")}'`)
      }
      
      changesList.push(`Topics: ${changes.join('; ')}`)
    }
  }
  
  if (changesList.length === 0) {
    return <p className="text-sm text-warm-text-muted">No visible changes</p>
  }
  
  return (
    <ul className="text-sm space-y-0.5">
      {changesList.map((change, index) => (
        <li key={index} className="text-warm-text-secondary">
          {change}
        </li>
      ))}
    </ul>
  )
}