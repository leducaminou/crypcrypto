'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLoadingSpiner from './components/ui/PageLoadingSpiner'

const IndexPage = () => {
  const router = useRouter()

  useEffect(() => {
    // Redirection immédiate après le rendu du composant
    router.push('/home')
  }, [router])

  return (
   <PageLoadingSpiner />
  )
}

export default IndexPage