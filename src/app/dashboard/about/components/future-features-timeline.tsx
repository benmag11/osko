"use client"

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView } from 'motion/react'
import { cn } from '@/lib/utils'

interface TimelineItem {
  id: string
  title: string
  description: string
  date: string
  side: 'left' | 'right'
  status?: 'complete' | 'in-progress' | 'future'
}

const timelineData: TimelineItem[] = [
  {
    id: '1',
    title: 'Past Questions Archive',
    description: 'Filter all past exam questions by topic, question number, keyword, and year. Hopefully more filter options to come soon.',
    date: 'September 1st',
    side: 'left',
    status: 'complete'
  },
  {
    id: '2',
    title: 'Progress Tracking',
    description: 'Mark each time you do a question, see a fresh looking dashboard showing your stats; How many questions you have done, what topics you have studied the most, etc.',
    date: '1st October',
    side: 'right',
    status: 'in-progress'
  },
  {
    id: '3',
    title: 'Exam Paper Archive',
    description: 'View and download any past exam paper.',
    date: '1st October',
    side: 'left',
    status: 'in-progress'
  },
  {
    id: '4',
    title: 'Resource Archive',
    description: 'A big index of all the online resources available for each subjects.',
    date: '20th October',
    side: 'right',
    status: 'future'
  },
  {
    id: '5',
    title: 'Worked Solutions for Maths',
    description: 'Fully worked solutions for all past Maths questions.',
    date: '31st October',
    side: 'left',
    status: 'future'
  },
  {
    id: '6',
    title: 'Flashcards',
    description: 'Spaced-repetition flashcards for each subject covering all definitions and rote-learnable material.',
    date: 'meh dk, each subject added over time',
    side: 'right',
    status: 'future'
  },

]

function TimelineEntry({ item, index, totalItems }: { item: TimelineItem; index: number; totalItems: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  const isLeft = item.side === 'left'
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'complete':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-sky-400 text-sky-600">
            Complete
          </span>
        )
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-orange-400 text-orange-600">
            In Progress
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-stone-300 text-stone-500">
            Future
          </span>
        )
    }
  }
  
  const getDotColor = (status?: string) => {
    switch (status) {
      case 'complete':
        return 'bg-sky-300'
      case 'in-progress':
        return 'bg-orange-300'
      default:
        return 'bg-stone-200'
    }
  }
  
  const getCardStyles = (status?: string) => {
    switch (status) {
      case 'complete':
        return 'bg-white border-sky-100 hover:border-sky-200'
      case 'in-progress':
        return 'bg-white border-orange-100 hover:border-orange-200'
      default:
        return 'bg-white border-stone-100 hover:border-stone-200'
    }
  }
  
  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative flex items-center",
        isLeft ? "justify-start" : "justify-end",
        index === totalItems - 1 ? "mb-0" : "-mb-3"
      )}
      style={{ zIndex: totalItems - index }}
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isLeft ? -30 : 30 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: "easeOut"
      }}
    >
      {/* Content Card */}
      <div
        className={cn(
          "relative z-10 w-[45%]",
          isLeft ? "mr-8" : "ml-8"
        )}
      >
        <div className={cn(
          "p-2.5 rounded-xl border transition-all duration-200",
          getCardStyles(item.status)
        )}>
          {/* Title and Status Badge */}
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-base font-serif font-medium text-stone-800 flex-1 pr-2">
              {item.title}
            </h3>
            {getStatusBadge(item.status)}
          </div>
          
          {/* Description */}
          <p className="text-xs leading-relaxed text-stone-600 mb-1">
            {item.description}
          </p>
          
          {/* Date */}
          <div className="text-xs font-medium text-stone-500">
            {item.date}
          </div>
        </div>
        
        {/* Connection Line */}
        <div
          className={cn(
            "absolute top-1/2 w-8 h-px",
            isLeft ? "right-0 bg-gradient-to-r from-transparent to-stone-200" : "left-0 bg-gradient-to-l from-transparent to-stone-200",
            isLeft ? "-right-8" : "-left-8"
          )}
          style={{ transform: 'translateY(-50%)' }}
        />
      </div>
      
      {/* Center Dot */}
      <motion.div
        className="absolute left-1/2 transform -translate-x-1/2 z-20"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{
          duration: 0.3,
          delay: index * 0.05 + 0.1,
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
      >
        <div
          className={cn(
            "w-3 h-3 rounded-full border-2 border-white",
            getDotColor(item.status)
          )}
        />
      </motion.div>
    </motion.div>
  )
}

export function FutureFeaturesTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 20%"]
  })
  
  const scaleY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })
  
  return (
    <section className="relative py-12" ref={containerRef}>
      {/* Header */}
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-sans font-semibold text-stone-800 mb-6">
          Future Features
        </h2>
        <div className="prose prose-stone max-w-3xl mx-auto">
          <p className="text-warm-text-secondary leading-relaxed font-serif text-xl">
            List of what has been done and what will be done (hopefully!).
          </p>
        </div>
      </div>
      
      {/* Timeline Container */}
      <div className="relative max-w-6xl mx-auto">
        {/* Animated Center Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
          {/* Background Line */}
          <div className="absolute inset-0 bg-stone-200" />
          
          {/* Animated Progress Line */}
          <motion.div
            className="absolute left-0 top-0 w-full origin-top bg-stone-800"
            style={{
              scaleY,
              height: '100%'
            }}
          />
        </div>
        
        {/* Timeline Entries */}
        <div className="relative">
          {timelineData.map((item, index) => (
            <TimelineEntry key={item.id} item={item} index={index} totalItems={timelineData.length} />
          ))}
        </div>
        
        {/* End Marker */}
        <motion.div
          className="relative flex justify-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <div className="px-4 py-2 bg-stone-800 text-white rounded-full text-sm font-medium">
            More features coming soon
          </div>
        </motion.div>
      </div>
    </section>
  )
}