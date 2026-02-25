import Link from 'next/link'

interface ModalEmptyStateProps {
  title: string
  description: string
  ctaText: string
  ctaHref: string
}



export default function ModalEmptyState({ 
  title,
  description,
  ctaText,
  ctaHref 
}: ModalEmptyStateProps ) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl">💼</span>
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      <Link
        href={ctaHref}
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg font-medium"
      >
        {ctaText}
      </Link>
    </div>
  )
}