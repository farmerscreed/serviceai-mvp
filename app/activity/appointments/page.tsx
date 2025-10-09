'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ActivityAppointmentsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to main appointments page since they serve the same purpose
    router.push('/appointments')
  }, [router])
  
  return null
}
