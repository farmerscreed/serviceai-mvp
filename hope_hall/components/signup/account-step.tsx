'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, AlertCircle } from 'lucide-react'
import type { SignupData } from '@/app/(auth)/signup/page'

interface AccountStepProps {
  initialData?: SignupData
  onNext: (data: Partial<SignupData>) => void
  onBack: () => void
}

export default function AccountStep({ initialData, onNext }: AccountStepProps) {
  const [email, setEmail] = useState(initialData?.email || '')
  const [password, setPassword] = useState(initialData?.password || '')
  const [confirmPassword, setConfirmPassword] = useState(initialData?.confirmPassword || '')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    onNext({ email, password, confirmPassword })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@yourvenue.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters long
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" id="terms" required className="rounded" />
        <label htmlFor="terms">
          I agree to the{' '}
          <a href="/terms" className="text-primary hover:underline" target="_blank">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-primary hover:underline" target="_blank">
            Privacy Policy
          </a>
        </label>
      </div>

      <Button type="submit" className="w-full" size="lg">
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  )
}
