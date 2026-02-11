'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { showSuccess, showError } from '@/lib/toast'
import { updateReportStatus } from '@/lib/supabase/report-actions'
import { QuestionEditModal } from '@/components/admin/question-edit-modal'
import { AudioQuestionEditModal } from '@/components/admin/audio-question-edit-modal'
import { AuditHistory } from '@/components/admin/audit-history'
import { formatDateTime } from '@/lib/utils/format-date'
import { formatQuestionTitle } from '@/lib/utils/question-format'
import { useTopics } from '@/lib/hooks/use-topics'
import { useAudioTopics } from '@/lib/hooks/use-audio-topics'
import type { QuestionReport, AudioQuestion, AudioTopic } from '@/lib/types/database'

interface ReportDetailsDialogProps {
  report: QuestionReport
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: () => void
}

export function ReportDetailsDialog({
  report,
  open,
  onOpenChange,
  onStatusChange
}: ReportDetailsDialogProps) {
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || '')
  const [showEditModal, setShowEditModal] = useState(false)
  const isAudio = report.question_type === 'audio'
  const subjectId = report.question?.subject_id || ''
  const { topics: normalTopics } = useTopics(isAudio ? '' : subjectId)
  const { topics: audioTopics } = useAudioTopics(isAudio ? subjectId : '')
  
  const updateMutation = useMutation({
    mutationFn: async () => {
      const result = await updateReportStatus(report.id, {
        status: 'resolved',
        admin_notes: adminNotes.trim() || undefined
      })
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: () => {
      showSuccess('Report resolved successfully')
      onStatusChange()
      onOpenChange(false)
    },
    onError: (error) => {
      showError(error.message)
    }
  })
  
  const question = report.question
  const questionTitle = question ? formatQuestionTitle(question) : 'Unknown Question'
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Question Info */}
            <div>
              <Label className="text-sm font-medium">Question</Label>
              <div className="mt-1 p-3 rounded-lg bg-cream-50 border border-stone-200">
                <p className="font-medium">{questionTitle}</p>
                {question?.topics && question.topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {question.topics.map((t) => (
                      <Badge key={t.id} variant="secondary" className="text-xs">
                        {t.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Report Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Report Type</Label>
                <div className="mt-1">
                  <Badge variant="outline">
                    {report.report_type === 'metadata' && 'Metadata Issue'}
                    {report.report_type === 'incorrect_topic' && 'Incorrect Topic'}
                    {report.report_type === 'other' && 'Other Issue'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  <Badge>
                    {report.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Reporter Info */}
            <div>
              <Label className="text-sm font-medium">Reported</Label>
              <p className="mt-1 text-sm">
                {formatDateTime(report.created_at)}
              </p>
            </div>
            
            {/* Description */}
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <div className="mt-1 p-3 rounded-lg bg-cream-50 border border-stone-200">
                <p className="text-sm whitespace-pre-wrap">
                  {report.description || <span className="text-warm-text-muted italic">No description provided</span>}
                </p>
              </div>
            </div>
            
            {/* Metadata Change History */}
            {question && (
              <div>
                <Label className="text-sm font-medium">Metadata Change History</Label>
                <div className="mt-1 p-3 rounded-lg bg-cream-50 border border-stone-200">
                  <AuditHistory questionId={question.id} questionType={report.question_type} topics={isAudio ? audioTopics : normalTopics} />
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Admin Section */}
            <div className="space-y-4">
              <h3 className="font-medium">Admin Actions</h3>
              
              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about how this was resolved..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              {/* Resolved Info */}
              {report.resolved_by && report.resolved_at && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm">
                    Resolved on {formatDateTime(report.resolved_at)}
                  </p>
                  {report.admin_notes && (
                    <p className="text-sm mt-2">
                      <strong>Notes:</strong> {report.admin_notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-2">
              {question && (
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Question Metadata
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {report.status !== 'resolved' && (
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Resolving...' : 'Mark as Resolved'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Question Modal — branches by question type */}
      {question && showEditModal && (
        isAudio ? (
          <AudioQuestionEditModal
            question={question as unknown as AudioQuestion}
            topics={audioTopics as AudioTopic[]}
            open={showEditModal}
            onOpenChange={setShowEditModal}
          />
        ) : (
          <QuestionEditModal
            question={question}
            topics={normalTopics}
            open={showEditModal}
            onOpenChange={setShowEditModal}
            onUpdateComplete={() => {
              // The audit history will auto-refresh via React Query invalidation
            }}
          />
        )
      )}
    </>
  )
}