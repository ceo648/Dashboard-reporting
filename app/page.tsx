'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Reindirizza automaticamente alla pagina onboarding
    router.push('/onboarding')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600">Reindirizzamento alla pagina di onboarding...</p>
      </div>
    </div>
  )
}

