// app/components/wrapper/AuthWrapper.tsx
'use client'

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Roles } from "@/app/lib/auth.config"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Ne traiter que lorsque la session est complètement chargée
    if (status === "loading") return

    // Si l'utilisateur est authentifié ET sur une page d'authentification
    if (status === "authenticated" && session?.user) {
      const isAuthPage = publicPaths.some(path => pathname?.startsWith(path))
      
      if (isAuthPage) {
        console.log(`AuthWrapper - Utilisateur authentifié sur page auth, redirection...`)
        // Rediriger vers la page appropriée selon le rôle
        const targetPath = session.user.role === Roles.ADMIN ? "/admin" : "/dashboard"
        router.push(targetPath)
      }
    }

    // Si l'utilisateur n'est pas authentifié ET essaie d'accéder à une page protégée
    // Cette logique est maintenant principalement gérée par le middleware
    if (status === "unauthenticated") {
      const isProtectedPage = !publicPaths.some(path => pathname?.startsWith(path)) 
                            && pathname !== "/"
                            && !pathname?.startsWith("/api/")
      
      if (isProtectedPage) {
        console.log(`AuthWrapper - Non authentifié sur page protégée: ${pathname}`)
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      }
    }
  }, [status, session, router, pathname])

  // Si en cours de chargement, afficher un loader
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/unauthorized", "/verify-email"]