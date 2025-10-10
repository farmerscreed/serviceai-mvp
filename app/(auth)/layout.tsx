import { SparkleNavbar } from '@/components/marketing/SparkleNavbar'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen sparkle-bg-pattern">
      <SparkleNavbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
