'use client'

import { motion } from 'motion/react'
import { YearPresenceStrip } from './year-presence-strip'
import { getFrequencyDisplayText } from '@/lib/utils/topic-predictions'
import type { TopicPrediction } from '@/lib/types/database'

interface TopicAnalysisRowProps {
  prediction: TopicPrediction
  allYears: number[]
  index: number
  dotColor: string
}

export function TopicAnalysisRow({ prediction, allYears, index, dotColor }: TopicAnalysisRowProps) {
  const freq = getFrequencyDisplayText(prediction.frequency_rate)

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 * Math.min(index, 10) }}
      className="flex items-center gap-3 py-2.5 sm:gap-4"
    >
      {/* Topic name */}
      <div className="w-1/3 min-w-0 shrink-0 sm:w-1/4">
        <p className="text-sm text-warm-text-primary truncate">
          {prediction.topic_name}
        </p>
      </div>

      {/* Year presence strip */}
      <div className="hidden flex-1 min-w-0 sm:block">
        <YearPresenceStrip
          allYears={allYears}
          yearList={prediction.year_list}
          dotColor={dotColor}
        />
      </div>

      {/* Frequency display */}
      <div className="w-24 text-right shrink-0">
        {freq.annotation ? (
          <span className="text-sm tabular-nums text-stone-500">
            {freq.primary}{' '}
            <span className="text-xs text-stone-400">{freq.annotation}</span>
          </span>
        ) : (
          <span className="text-sm font-medium text-salmon-600">
            {freq.primary}
          </span>
        )}
      </div>
    </motion.div>
  )
}
