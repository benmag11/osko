import type {
  TopicFrequencyAnalysis,
  TopicFrequencyData,
  TopicPrediction,
  LikelihoodCategory,
} from '@/lib/types/database'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function computeSinglePrediction(
  topic: TopicFrequencyData,
  totalYears: number,
  maxYear: number
): TopicPrediction {
  const frequencyRate = totalYears > 0 ? topic.years_appeared / totalYears : 0
  const recentRate = topic.recent_appearances / 5

  const yearsSinceLast = topic.last_year != null ? maxYear - topic.last_year : null
  const expectedInterval =
    topic.years_appeared > 0 ? totalYears / topic.years_appeared : null

  let overdueBonus = 0
  let overdue = false

  if (yearsSinceLast != null && expectedInterval != null && expectedInterval > 0) {
    overdue = yearsSinceLast > expectedInterval
    if (overdue) {
      overdueBonus = clamp(
        (yearsSinceLast - expectedInterval) / expectedInterval,
        0,
        1
      )
    }
  }

  const likelihoodScore =
    0.5 * frequencyRate + 0.3 * recentRate + 0.2 * overdueBonus

  let likelihoodCategory: LikelihoodCategory
  if (likelihoodScore >= 0.7) {
    likelihoodCategory = 'Very Likely'
  } else if (likelihoodScore >= 0.45) {
    likelihoodCategory = 'Likely'
  } else if (likelihoodScore >= 0.25) {
    likelihoodCategory = 'Possible'
  } else {
    likelihoodCategory = 'Unlikely'
  }

  return {
    ...topic,
    frequency_rate: frequencyRate,
    recent_rate: recentRate,
    overdue,
    years_since_last: yearsSinceLast,
    expected_interval: expectedInterval,
    likelihood_score: likelihoodScore,
    likelihood_category: likelihoodCategory,
  }
}

export function computePredictions(
  analysis: TopicFrequencyAnalysis
): TopicPrediction[] {
  if (analysis.total_years === 0 || analysis.max_year == null) {
    return []
  }

  return analysis.topics
    .map((topic) =>
      computeSinglePrediction(topic, analysis.total_years, analysis.max_year!)
    )
    .sort((a, b) => b.likelihood_score - a.likelihood_score)
}

const CATEGORY_ORDER: LikelihoodCategory[] = [
  'Very Likely',
  'Likely',
  'Possible',
  'Unlikely',
]

export function groupByLikelihood(
  predictions: TopicPrediction[]
): Record<LikelihoodCategory, TopicPrediction[]> {
  const groups: Record<LikelihoodCategory, TopicPrediction[]> = {
    'Very Likely': [],
    'Likely': [],
    'Possible': [],
    'Unlikely': [],
  }

  for (const prediction of predictions) {
    groups[prediction.likelihood_category].push(prediction)
  }

  return groups
}

export { CATEGORY_ORDER }

export const CATEGORY_DOT_COLORS: Record<LikelihoodCategory, string> = {
  'Very Likely': 'bg-salmon-500',
  'Likely': 'bg-salmon-400',
  'Possible': 'bg-salmon-300',
  'Unlikely': 'bg-stone-300',
}

export function getFrequencyDisplayText(frequencyRate: number): {
  primary: string
  annotation?: string
} {
  if (frequencyRate === 1) {
    return { primary: 'Every year' }
  }
  return {
    primary: `${Math.round(frequencyRate * 100)}%`,
    annotation: 'of years',
  }
}
