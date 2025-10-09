import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth/auth-context'
import { OrganizationProvider } from '@/lib/organizations/organization-context'
import { ToastProvider } from '@/components/ui/Toast'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'
import { NotificationProvider } from '@/components/ui/NotificationSystem'
import AppShell from '@/components/layout/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: 'ServiceAI - Multi-Industry AI Phone Assistant Platform',
  description: 'AI-powered phone assistants for service industries with multi-language support and SMS integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <ConfirmProvider>
            <NotificationProvider>
              <AuthProvider>
                <OrganizationProvider>
                  <AppShell>
                    {children}
                  </AppShell>
                </OrganizationProvider>
              </AuthProvider>
            </NotificationProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
