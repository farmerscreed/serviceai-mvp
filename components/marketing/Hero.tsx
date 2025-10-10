'use client'

import Link from 'next/link'
import { ArrowRight, Play, Sparkles, Zap, Shield, Globe } from 'lucide-react'

interface HeroProps {
  title?: string
  subtitle?: string
  description?: string
  primaryCTA?: {
    text: string
    href: string
  }
  secondaryCTA?: {
    text: string
    href: string
  }
  showVideo?: boolean
  videoSrc?: string
}

export function Hero({
  title = "Multi-Industry AI Phone Assistant Platform",
  subtitle = "New • Multi-language assistants (English/Spanish)",
  description = "AI-powered phone assistants with emergency detection, appointment booking, and integrated SMS. Launch in minutes with industry templates and native Spanish support.",
  primaryCTA = {
    text: "Start Free Trial",
    href: "/auth/signup"
  },
  secondaryCTA = {
    text: "Watch Demo",
    href: "#demo"
  },
  showVideo = false,
  videoSrc = ""
}: HeroProps) {
  const features = [
    { icon: Zap, text: "5-Minute Setup" },
    { icon: Shield, text: "Enterprise Security" },
    { icon: Globe, text: "Multi-Language" },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 sparkle-bg-pattern"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-sparkle-50 via-white to-purple-50"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-sparkle-200 to-purple-200 rounded-full blur-xl animate-float opacity-60"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-purple-200 to-emerald-200 rounded-full blur-xl animate-float opacity-40" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-br from-emerald-200 to-sparkle-200 rounded-full blur-xl animate-float opacity-50" style={{ animationDelay: '4s' }}></div>

      <div className="sparkle-container relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 shadow-lg">
            <Sparkles className="w-4 h-4 text-sparkle-500 animate-sparkle" />
            <span className="text-sm font-semibold text-gray-700">{subtitle}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            <span className="block">{title.split(' ').slice(0, 3).join(' ')}</span>
            <span className="block sparkle-text-gradient">
              {title.split(' ').slice(3).join(' ')}
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-lg"
                >
                  <Icon className="w-4 h-4 text-sparkle-500" />
                  <span className="text-sm font-medium text-gray-700">{feature.text}</span>
                </div>
              )
            })}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href={primaryCTA.href}
              className="sparkle-button group"
            >
              {primaryCTA.text}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            {secondaryCTA && (
              <Link
                href={secondaryCTA.href}
                className="sparkle-button-secondary group"
              >
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                {secondaryCTA.text}
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold sparkle-text-gradient mb-1">95%+</div>
              <div className="text-sm text-gray-600">Emergency Detection Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold sparkle-text-gradient mb-1">24/7</div>
              <div className="text-sm text-gray-600">AI Assistant Availability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold sparkle-text-gradient mb-1">2</div>
              <div className="text-sm text-gray-600">Languages Supported</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  )
}
