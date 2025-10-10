import DemoCallForm from '@/components/DemoCallForm'
import { SparkleNavbar } from '@/components/marketing/SparkleNavbar'
import { SparkleFooter } from '@/components/marketing/SparkleFooter'
import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureCard'
import { CTASection } from '@/components/marketing/CTASection'

// Hardcode industries for the demo form
const INDUSTRIES = [
  { code: 'hvac', name: 'HVAC' },
  { code: 'plumbing', name: 'Plumbing' },
  { code: 'electrical', name: 'Electrical' },
  { code: 'medical', name: 'Medical' },
  { code: 'veterinary', name: 'Veterinary' },
  { code: 'property', name: 'Property Management' },
]

const features = [
  {
    iconName: 'Phone' as const,
    title: "24/7 AI Phone Assistant",
    description: "Never miss a call with AI-powered assistants that handle customer inquiries, book appointments, and detect emergencies automatically.",
    gradient: "from-sparkle-500 to-purple-500"
  },
  {
    iconName: 'Globe' as const,
    title: "Multi-Language Support",
    description: "Native English and Spanish support with automatic language detection and cultural communication competency.",
    gradient: "from-emerald-500 to-sparkle-500"
  },
  {
    iconName: 'MessageSquare' as const,
    title: "SMS Integration",
    description: "Automated appointment confirmations, reminders, and emergency alerts via SMS in customer's preferred language.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    iconName: 'AlertTriangle' as const,
    title: "Emergency Detection",
    description: "Industry-specific AI detects emergencies with 95%+ accuracy and routes high-value calls immediately.",
    gradient: "from-red-500 to-orange-500"
  },
  {
    iconName: 'Building2' as const,
    title: "Industry Templates",
    description: "Pre-configured templates for HVAC, Plumbing, Electrical, Medical, Veterinary, and Property Management.",
    gradient: "from-amber-500 to-yellow-500"
  },
  {
    iconName: 'Zap' as const,
    title: "5-Minute Setup",
    description: "Get your AI phone assistant live in 5 minutes with our rapid deployment process using industry templates.",
    gradient: "from-indigo-500 to-purple-500"
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen sparkle-bg-pattern">
      {/* Navigation */}
      <SparkleNavbar />

      {/* Hero Section */}
      <Hero />

      {/* Demo Call Section */}
      <section className="py-16 sm:py-20">
        <div className="sparkle-container">
          <DemoCallForm industries={INDUSTRIES} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20">
        <div className="sparkle-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
              Everything you need to
              <span className="block sparkle-text-gradient">transform your business</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful AI features designed specifically for service businesses to improve customer experience and operational efficiency.
            </p>
          </div>
          <FeatureGrid features={features} />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white/50">
        <div className="sparkle-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
              How it works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Get your AI phone assistant up and running in just 5 minutes with our simple 3-step process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-sparkle-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Industry</h3>
              <p className="text-gray-600">Select from our pre-configured templates for HVAC, Plumbing, Electrical, Medical, Veterinary, or Property Management.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-sparkle-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Customize Your Assistant</h3>
              <p className="text-gray-600">Add your business details, phone number, and preferences. Our AI learns your specific requirements.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Go Live</h3>
              <p className="text-gray-600">Your AI assistant is ready to handle calls, book appointments, and detect emergencies 24/7.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <SparkleFooter />
    </div>
  )
}
