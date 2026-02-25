'use client'

import { copyToClipboard } from '@/app/lib/copyToClipboard'
import { useState } from 'react'

interface ReferralLinkCardProps {
  referralLink: string;
}

export default function ReferralLinkCard2({referralLink}:ReferralLinkCardProps) {
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopyClick = async (): Promise<void> => {
    try {
      await copyToClipboard(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Échec de la copie:', err)
      // Vous pourriez ajouter un toast ou un message d'erreur ici
    }
  }

  return (
    <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div className="mb-4 sm:mb-0">
                  <p className="font-medium">Votre lien de parrainage</p>
                  <p className="text-gray-400 text-sm">Partagez et gagnez 5% des dépôts</p>
                </div>
               
                <button
          onClick={handleCopyClick}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg font-medium"
          aria-label={copied ? 'Lien copié' : 'Copier le lien de parrainage'}
        >
          {copied ? 'Copié !' : 'Copier le lien'}
        </button>
              </div>
            </div>
  )
}