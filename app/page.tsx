import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      </div>
      <nav className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">S</div>
              <span className="ml-3 text-xl font-bold tracking-tight text-slate-900">ServiceAI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:shadow"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <p className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
            New • Multi-language assistants (English/Spanish)
          </p>
          <h1 className="mt-6 text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl">
            <span className="block">Multi-Industry AI Phone</span>
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Assistant Platform</span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base text-slate-600 sm:text-lg md:mt-6 md:text-xl">
            AI-powered phone assistants with emergency detection, appointment booking, and integrated SMS.
            Launch in minutes with industry templates and native Spanish support.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 text-base font-medium shadow-sm hover:shadow"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md text-blue-700 bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 text-base font-medium"
            >
              Learn more
            </Link>
          </div>
        </div>

        <div id="features" className="mt-24">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-slate-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-600 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">24/7 AI Phone Assistant</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Never miss a call with AI-powered assistants that handle customer inquiries, book appointments, 
                  and detect emergencies automatically.
                </p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-slate-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-emerald-600 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Multi-Language Support</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Native English and Spanish support with automatic language detection and cultural communication competency.
                </p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-slate-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-600 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">SMS Integration</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Automated appointment confirmations, reminders, and emergency alerts via SMS in customer's preferred language.
                </p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-slate-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-rose-600 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Emergency Detection</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Industry-specific AI detects emergencies with 95%+ accuracy and routes high-value calls immediately.
                </p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-slate-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Industry Templates</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Pre-configured templates for HVAC, Plumbing, Electrical, Medical, Veterinary, and Property Management.
                </p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-xl border border-slate-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-600 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">5-Minute Setup</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Get your AI phone assistant live in 5 minutes with our rapid deployment process using industry templates.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-12 sm:px-12 sm:py-16">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-blue-100">
                Join service businesses using AI to never miss an opportunity.
              </p>
              <Link
                href="/auth/signup"
                className="mt-8 inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 shadow-sm"
              >
                Create your account
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-24">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-500 text-sm">
            © 2025 ServiceAI. All rights reserved.
        </p>
      </div>
      </footer>
    </div>
  )
}
