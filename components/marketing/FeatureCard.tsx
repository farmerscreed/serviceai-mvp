'use client'

import { ReactNode } from 'react'
import * as LucideIcons from 'lucide-react'

type IconName = keyof typeof LucideIcons

interface FeatureCardProps {
  iconName: IconName
  title: string
  description: string
  gradient?: string
  delay?: number
  className?: string
}

export function FeatureCard({
  iconName,
  title,
  description,
  gradient = "from-sparkle-500 to-purple-500",
  delay = 0,
  className = ""
}: FeatureCardProps) {
  const Icon = LucideIcons[iconName] as LucideIcons.LucideIcon

  return (
    <div
      className={`sparkle-card p-6 sm:p-8 group hover:scale-105 transition-all duration-500 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className="relative mb-6">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`absolute -inset-1 bg-gradient-to-br ${gradient} rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>
      </div>

      {/* Content */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 group-hover:text-sparkle-600 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-sparkle-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  )
}

interface FeatureGridProps {
  features: Array<{
    iconName: IconName
    title: string
    description: string
    gradient?: string
  }>
  className?: string
}

export function FeatureGrid({ features, className = "" }: FeatureGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 ${className}`}>
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          iconName={feature.iconName}
          title={feature.title}
          description={feature.description}
          gradient={feature.gradient}
          delay={index * 100}
        />
      ))}
    </div>
  )
}
