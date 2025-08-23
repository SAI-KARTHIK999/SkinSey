import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useOnboarding() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user) {
      // Immediately check onboarding status
      checkOnboardingStatus()
    }
  }, [session, status, router])

  // Also check when component mounts if we already have a session
  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      checkOnboardingStatus()
    }
  }, [session, status])

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding')
      if (response.ok) {
        const data = await response.json()
        setOnboardingCompleted(data.onboardingCompleted)
        
        if (!data.onboardingCompleted) {
          // Immediately redirect to prevent flash
          router.replace('/onboarding')
        }
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  return { isChecking, onboardingCompleted }
}

