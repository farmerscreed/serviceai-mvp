'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react'

interface CTASectionProps {
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
  features?: string[]
  gradient?: string
  className?: string
}

export function CTASection({
  title = "Ready to get started?",
  subtitle = "Join thousands of service businesses",
  description = "Transform your customer service with AI-powered phone assistants. Get started in minutes with our industry templates.",
  primaryCTA = {
    text: "Start Free Trial",
    href: "/auth/signup"
  },
  secondaryCTA = {
    text: "Schedule Demo",
    href: "/contact"
  },
  features = [
    "No setup fees",
    "14-day free trial",
    "Cancel anytime",
    "24/7 support"
  ],
  gradient = "from-sparkle-600 to-purple-600",
  className = ""
}: CTASectionProps) {
  return (
    <section className={`relative py-16 sm:py-20 lg:py-24 ${className}`}>
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}></div>
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1.5s' }}></div>

      <div className="sparkle-container relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-white animate-sparkle" />
            <span className="text-sm font-semibold text-white">{subtitle}</span>
          </div>

          {/* Main Content */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            {title}
          </h2>
          
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>

          {/* Features */}
          {features && features.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={primaryCTA.href}
              className="bg-white text-gray-900 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 group"
            >
              {primaryCTA.text}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            {secondaryCTA && (
              <Link
                href={secondaryCTA.href}
                className="bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {secondaryCTA.text}
              </Link>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-white/70 text-sm mb-4">Trusted by service businesses worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {/* Placeholder for company logos */}
              <div className="text-white/50 text-sm font-medium">HVAC Pro</div>
              <div className="text-white/50 text-sm font-medium">PlumbTech</div>
              <div className="text-white/50 text-sm font-medium">ElectroFix</div>
              <div className="text-white/50 text-sm font-medium">MedCare</div>
              <div className="text-white/50 text-sm font-medium">VetClinic</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
