'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, X, Eye } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ReportDetailsDialog } from '@/components/admin/report-details-dialog'
import { updateReportStatus } from '@/lib/supabase/report-actions'
import { formatDate } from '@/lib/utils/format-date'
import type { QuestionReport } from '@/lib/types/database'

interface ReportsTableProps {
  reports: QuestionReport[]
  isLoading: boolean
  onStatusChange: () => void
}

export function ReportsTable({ reports, isLoading, onStatusChange }: ReportsTableProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  
  // Derive the selected report from the fresh reports array
  const selectedReport = selectedReportId 
    ? reports.find(r => r.id === selectedReportId) || null
    : null
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      reportId, 
      status 
    }: { 
      reportId: string
      status: 'pending' | 'resolved' | 'dismissed' 
    }) => {
      const result = await updateReportStatus(reportId, { status })
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: () => {
      toast.success('Report status updated')
      onStatusChange()
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
  
  const getStatusBadge = (status: string) => {
    const colorClasses: Record<string, string> = {
      pending: '', // Uses default salmon color
      resolved: 'bg-green-600 hover:bg-green-700',
      dismissed: 'bg-red-600 hover:bg-red-700'
    }
    
    return (
      <Badge 
        variant="default"
        className={colorClasses[status] || ''}
      >
        {status}
      </Badge>
    )
  }
  
  const getReportTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      metadata: 'Metadata',
      incorrect_topic: 'Topic',
      other: 'Other'
    }
    
    return (
      <Badge variant="outline">
        {labels[type] || type}
      </Badge>
    )
  }
  
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }
  
  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-warm-text-muted">No reports found</p>
      </div>
    )
  }
  
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const question = report.question
            const questionTitle = question ?
              `${question.year} Q${question.question_number}${
                question.question_parts?.length > 0
                  ? ` (${question.question_parts.join(', ')})`
                  : ''
              }${
                question.additional_info ? ` - ${question.additional_info}` : ''
              }` : 'Unknown'
            
            const subjectName = report.question?.subject?.name || 'Unknown Subject'
            
            return (
              <TableRow key={report.id}>
                <TableCell className="font-medium">
                  {questionTitle}
                </TableCell>
                <TableCell>
                  {subjectName}
                </TableCell>
                <TableCell>
                  {getReportTypeBadge(report.report_type)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(report.status)}
                </TableCell>
                <TableCell>
                  {formatDate(report.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReportId(report.id)
                        setShowDetailsDialog(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {report.status !== 'resolved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({
                          reportId: report.id,
                          status: 'resolved'
                        })}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {report.status !== 'dismissed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({
                          reportId: report.id,
                          status: 'dismissed'
                        })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      
      {selectedReport && (
        <ReportDetailsDialog
          report={selectedReport}
          open={showDetailsDialog}
          onOpenChange={(open) => {
            setShowDetailsDialog(open)
            if (!open) {
              setSelectedReportId(null) // Clear ID when closing
            }
          }}
          onStatusChange={onStatusChange}
        />
      )}
    </>
  )
}