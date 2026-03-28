'use client'

import { motion } from 'motion/react'
import { TopicAnalysisRow } from './topic-analysis-row'
import { CATEGORY_DOT_COLORS } from '@/lib/utils/topic-predictions'
import type { TopicPrediction, LikelihoodCategory } from '@/lib/types/database'

interface LikelihoodTierGroupProps {
  category: LikelihoodCategory
  predictions: TopicPrediction[]
  allYears: number[]
  tierIndex: number
}

export function LikelihoodTierGroup({
  category,
  predictions,
  allYears,
  tierIndex,
}: LikelihoodTierGroupProps) {
  if (predictions.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 * tierIndex }}
      className="mb-6 last:mb-0"
    >
      <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-2 border-b border-stone-100 pb-2">
        {category}
      </h3>
      <div className="divide-y divide-stone-100">
        {predictions.map((prediction, index) => (
          <TopicAnalysisRow
            key={prediction.topic_id}
            prediction={prediction}
            allYears={allYears}
            index={index}
            dotColor={CATEGORY_DOT_COLORS[category]}
          />
        ))}
      </div>
    </motion.div>
  )
}
