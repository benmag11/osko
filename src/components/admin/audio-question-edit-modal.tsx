'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { updateAudioQuestionMetadata } from '@/lib/supabase/admin-actions'
import type { AudioQuestion, AudioTopic } from '@/lib/types/database'

interface AudioQuestionEditModalProps {
  question: AudioQuestion
  topics: AudioTopic[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateComplete?: (auditLogId?: string) => void
}

export function AudioQuestionEditModal({
  question,
  topics,
  open,
  onOpenChange,
  onUpdateComplete
}: AudioQuestionEditModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Form state
  const [year, setYear] = useState(question.year.toString())
  const [paperNumber, setPaperNumber] = useState(question.paper_number?.toString() || '')
  const [questionNumber, setQuestionNumber] = useState(question.question_number?.toString() ?? '')
  const [questionParts, setQuestionParts] = useState(question.question_parts?.join(', ') || '')
  const [examType, setExamType] = useState(question.exam_type)
  const [additionalInfo, setAdditionalInfo] = useState(question.additional_info || '')
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    question.topics?.map(t => t.id) || []
  )

  // Sync state when dialog opens or question changes
  useEffect(() => {
    if (open) {
      setYear(question.year.toString())
      setPaperNumber(question.paper_number?.toString() || '')
      setQuestionNumber(question.question_number?.toString() ?? '')
      setQuestionParts(question.question_parts?.join(', ') || '')
      setExamType(question.exam_type)
      setAdditionalInfo(question.additional_info || '')
      setSelectedTopics(question.topics?.map(t => t.id) || [])
    }
  }, [open, question])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates = {
        year: parseInt(year),
        paper_number: paperNumber ? parseInt(paperNumber) : null,
        question_number: questionNumber === '' ? null : parseInt(questionNumber),
        question_parts: questionParts.split(',').map(p => p.trim()).filter(Boolean),
        exam_type: examType as 'normal' | 'deferred' | 'supplemental',
        additional_info: additionalInfo.trim() || null,
        topic_ids: selectedTopics
      }

      const result = await updateAudioQuestionMetadata(question.id, updates)
      if (!result.success) {
        throw new Error(result.error || 'Update failed')
      }
      return result
    },
    onSuccess: (data) => {
      toast.success('Audio question updated successfully')
      queryClient.invalidateQueries({ queryKey: ['audio-questions'] })
      queryClient.invalidateQueries({ queryKey: ['audio-audit-history', question.id] })
      router.refresh()
      onUpdateComplete?.(data.auditLogId)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Audio Question Metadata</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
          {/* Year Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">Year</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Paper Number */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paper" className="text-right">Paper Number</Label>
            <Input
              id="paper"
              type="number"
              value={paperNumber}
              onChange={(e) => setPaperNumber(e.target.value)}
              placeholder="Optional"
              className="col-span-3"
            />
          </div>

          {/* Question Number */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="qnum" className="text-right">Question Number</Label>
            <Input
              id="qnum"
              type="number"
              value={questionNumber}
              onChange={(e) => setQuestionNumber(e.target.value)}
              placeholder="Leave empty for no question number, or 0 for placeholder"
              className="col-span-3"
            />
          </div>

          {/* Question Parts */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parts" className="text-right">Parts</Label>
            <Input
              id="parts"
              value={questionParts}
              onChange={(e) => setQuestionParts(e.target.value)}
              placeholder="a, b, c"
              className="col-span-3"
            />
          </div>

          {/* Exam Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Exam Type</Label>
            <Select value={examType} onValueChange={(value) => setExamType(value as 'normal' | 'deferred' | 'supplemental')}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="deferred">Deferred</SelectItem>
                <SelectItem value="supplemental">Supplemental</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="additional-info" className="text-right">Additional Info</Label>
            <Input
              id="additional-info"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="e.g., Section 5"
              className="col-span-3"
            />
          </div>

          {/* Topics */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Topics</Label>
            <div className="col-span-3 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {topics.length > 0 ? (
                topics.map(topic => (
                  <div key={topic.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={topic.id}
                      checked={selectedTopics.includes(topic.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTopics([...selectedTopics, topic.id])
                        } else {
                          setSelectedTopics(selectedTopics.filter(id => id !== topic.id))
                        }
                      }}
                    />
                    <Label htmlFor={topic.id} className="cursor-pointer">
                      {topic.name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No topics available for this subject</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
