'use client'

import { useState, useCallback, memo } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Question } from '@/lib/types/database'

interface QuestionCardProps {
  question: Question
}

export const QuestionCard = memo(function QuestionCard({ question }: QuestionCardProps) {
  const [showMarkingScheme, setShowMarkingScheme] = useState(false)
  
  const toggleMarkingScheme = useCallback(() => {
    setShowMarkingScheme(prev => !prev)
  }, [])
  
  // Format question parts with parentheses
  const formattedParts = question.question_parts.length > 0
    ? question.question_parts.map(part => `(${part})`).join(', ')
    : ''
  
  // Build title with new format: [year] - Paper [paper_number] - Question [question_number] - [subparts]
  let title = `${question.year}`
  
  // Add paper number if it exists
  if (question.paper_number) {
    title += ` - Paper ${question.paper_number}`
  }
  
  // Add question number
  title += ` - Question ${question.question_number}`
  
  // Add formatted parts if they exist
  if (formattedParts) {
    title += ` - ${formattedParts}`
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-exam-neutral">
        {title}
      </h3>
      
      <div className="overflow-hidden rounded-xl shadow-[0_0_7px_rgba(0,0,0,0.25)]">
        <div className="relative w-full bg-white">
          <Image
            src={question.question_image_url}
            alt={`Question ${question.question_number}`}
            width={1073}
            height={800}
            className="w-full h-auto"
            priority={false}
          />
        </div>
        
        <div className="bg-primary/10 rounded-b-xl">
          <div className="flex justify-center py-4">
            <Button
              onClick={toggleMarkingScheme}
              className="bg-[#438FD5] hover:bg-[#3A7FC2] text-white"
            >
              {showMarkingScheme ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Hide marking scheme
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Show marking scheme
                </>
              )}
            </Button>
          </div>
          
          {showMarkingScheme && (
            <div className="px-4 pb-4">
              <Image
                src={question.marking_scheme_image_url}
                alt={`Marking scheme for question ${question.question_number}`}
                width={1073}
                height={800}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})