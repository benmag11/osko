'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, CheckCircle, Clock } from 'lucide-react'
import { ReportsTable } from '@/components/admin/reports-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getReports, getReportStatistics } from '@/lib/supabase/report-actions'
import type { QuestionReport, ReportStatistics } from '@/lib/types/database'

interface ReportsClientProps {
  initialReports: QuestionReport[]
  initialStatistics: ReportStatistics | null
}

export function ReportsClient({ initialReports, initialStatistics }: ReportsClientProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all')
  const queryClient = useQueryClient()
  
  // Fetch reports with filter
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', statusFilter],
    queryFn: () => statusFilter === 'all' ? getReports() : getReports(statusFilter),
    initialData: statusFilter === 'all' ? initialReports : undefined,
    staleTime: 30 * 1000, // 30 seconds
  })
  
  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ['report-statistics'],
    queryFn: getReportStatistics,
    initialData: initialStatistics,
    staleTime: 30 * 1000,
  })
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-warm-text-primary">
          Question Reports
        </h1>
        <Badge variant="outline" className="gap-1">
          <Flag className="h-3 w-3" />
          {statistics?.total_reports || 0} Total Reports
        </Badge>
      </div>
      
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reports
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.pending_reports}</div>
              <p className="text-xs text-warm-text-muted">
                Awaiting review
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resolved Reports
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.resolved_reports}</div>
              <p className="text-xs text-warm-text-muted">
                Successfully addressed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Report Types
              </CardTitle>
              <Flag className="h-4 w-4 text-coral-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Metadata:</span>
                  <span className="font-medium">{statistics.reports_by_type.metadata}</span>
                </div>
                <div className="flex justify-between">
                  <span>Topics:</span>
                  <span className="font-medium">{statistics.reports_by_type.incorrect_topic}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other:</span>
                  <span className="font-medium">{statistics.reports_by_type.other}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Reports Table with Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed')}>
            <TabsList>
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                {statistics?.pending_reports ? (
                  <Badge variant="secondary" className="ml-1.5">
                    {statistics.pending_reports}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ReportsTable 
            reports={reports || []} 
            isLoading={isLoading}
            onStatusChange={() => {
              queryClient.invalidateQueries({ queryKey: ['reports'] })
              queryClient.invalidateQueries({ queryKey: ['report-statistics'] })
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}