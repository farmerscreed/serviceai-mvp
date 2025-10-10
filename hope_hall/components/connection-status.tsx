"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/Button'
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Loader2 
} from 'lucide-react'

export function ConnectionStatus() {
  const { connectionStatus, refreshSession, loading } = useAuth()
  const [isRetrying, setIsRetrying] = useState(false)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Show status when there are connection issues
    setShowStatus(connectionStatus === 'disconnected' || connectionStatus === 'connecting')
  }, [connectionStatus])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await refreshSession()
    } catch (error) {
      console.error('Manual retry failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  // Don't show anything during initial loading
  if (loading) {
    return null
  }

  // Don't show when connected
  if (connectionStatus === 'connected' && !showStatus) {
    return null
  }

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          title: 'Connected',
          description: 'Your connection is stable',
          variant: 'default' as const,
          showRetry: false
        }
      case 'connecting':
        return {
          icon: <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />,
          title: 'Connecting...',
          description: 'Establishing connection to Hope Hall servers',
          variant: 'default' as const,
          showRetry: false
        }
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4 text-red-600" />,
          title: 'Connection Lost',
          description: 'Unable to connect to Hope Hall servers. Your session may have expired.',
          variant: 'destructive' as const,
          showRetry: true
        }
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
          title: 'Connection Status Unknown',
          description: 'Checking connection status...',
          variant: 'default' as const,
          showRetry: true
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert variant={config.variant} className="shadow-lg border-2">
        <div className="flex items-center gap-2">
          {config.icon}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{config.title}</h4>
            <AlertDescription className="text-xs mt-1">
              {config.description}
            </AlertDescription>
          </div>
          {config.showRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isRetrying}
              className="ml-2"
            >
              {isRetrying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </Alert>
    </div>
  )
}

// Network status hook for additional network monitoring
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('🌐 Network connection restored')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('🌐 Network connection lost')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline }
}

// Session expiry warning component
export function SessionExpiryWarning() {
  const { session } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    if (!session) return

    const checkSessionExpiry = () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || 0
      const remaining = expiresAt - now

      setTimeRemaining(remaining)

      // Show warning if session expires in less than 5 minutes
      if (remaining > 0 && remaining < 300) {
        setShowWarning(true)
      } else {
        setShowWarning(false)
      }
    }

    // Check immediately
    checkSessionExpiry()

    // Check every 30 seconds
    const interval = setInterval(checkSessionExpiry, 30000)

    return () => clearInterval(interval)
  }, [session])

  if (!showWarning) return null

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant="default" className="shadow-lg border-2 border-yellow-400">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <div>
          <h4 className="font-semibold text-sm">Session Expiring Soon</h4>
          <AlertDescription className="text-xs mt-1">
            Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')}. 
            Your session will be automatically refreshed.
          </AlertDescription>
        </div>
      </Alert>
    </div>
  )
} 
