'use client'

import { copyToClipboard } from '@/app/lib/copyToClipboard'
import { useState } from 'react'

interface ReferralLinkCardProps {
  referralLink: string;
}

export default function ReferralLinkCard({referralLink}:ReferralLinkCardProps) {
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
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Votre lien de parrainage</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 p-3 bg-gray-700 rounded-lg border border-gray-600 overflow-x-auto">
          <code className="text-sm">{referralLink}</code>
        </div>
        <button
          onClick={handleCopyClick}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg font-medium whitespace-nowrap"
          aria-label={copied ? 'Lien copié' : 'Copier le lien de parrainage'}
        >
          {copied ? 'Copié !' : 'Copier le lien'}
        </button>
      </div>
      <p className="text-gray-400 text-sm mt-4">
        Recevez 10% des dépôts de vos filleuls pendant leurs 3 premiers mois
      </p>
    </div>
  )
}