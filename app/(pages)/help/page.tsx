'use client'
import React, { useState } from 'react'
import Navbar from '@/app/components/ui/Navbar'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/app/components/ui/Footer'

export default function FAQPage() {
  // Catégories de questions
  const faqCategories = [
    {
      id: 'general',
      name: 'Général',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      )
    },
    {
      id: 'investment',
      name: 'Investissement',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      )
    },
    {
      id: 'withdrawal',
      name: 'Retraits',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      )
    },
    {
      id: 'security',
      name: 'Sécurité',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    }
  ]

  // Questions et réponses
  const faqItems = [
    {
      id: 1,
      category: 'general',
      question: "Qu'est-ce que Jua Trad'X ?",
      answer: "Jua Trad'X est une plateforme d'investissement en ligne qui propose des programmes d'investissement alternatifs avec des rendements compétitifs. Nous offrons une gamme de plans d'investissement adaptés à différents profils d'investisseurs."
    },
    {
      id: 2,
      category: 'general',
      question: "Comment créer un compte ?",
      answer: "Pour créer un compte, cliquez sur le bouton 'S'inscrire' en haut à droite de la page. Vous devrez fournir quelques informations de base et vérifier votre adresse email. Le processus ne prend que quelques minutes."
    },
    {
      id: 3,
      category: 'investment',
      question: "Quels sont les plans d'investissement disponibles ?",
      answer: "Nous proposons plusieurs plans avec des durées et rendements différents : Starter (1.8% quotidien sur 30 jours), Advanced (2.2% quotidien sur 45 jours), Professional (2.8% quotidien sur 60 jours) et VIP (3.5% quotidien sur 90 jours)."
    },
    {
      id: 4,
      category: 'investment',
      question: "Quel est le montant minimum d'investissement ?",
      answer: "Le montant minimum d'investissement est de 50$ pour le plan Starter. Les autres plans ont des minimums plus élevés : 1000$ pour Advanced, 5000$ pour Professional et 20000$ pour VIP."
    },
    {
      id: 5,
      category: 'withdrawal',
      question: "Comment effectuer un retrait ?",
      answer: "Dans votre tableau de bord, allez dans la section 'Retraits', sélectionnez le montant et la méthode de paiement. Les retraits sont traités sous 24-48 heures. Les premiers retraits peuvent nécessiter une vérification supplémentaire."
    },
    {
      id: 6,
      category: 'withdrawal',
      question: "Y a-t-il des frais de retrait ?",
      answer: "Nous ne prélevons aucun frais sur vos retraits. Cependant, selon la méthode de retrait choisie, des frais réseau ou de transaction peuvent s'appliquer (comme les frais du réseau Bitcoin pour les retraits en crypto)."
    },
    {
      id: 7,
      category: 'security',
      question: "Mes fonds sont-ils sécurisés ?",
      answer: "Nous utilisons des technologies de cryptage de niveau bancaire et stockons la majorité des fonds dans des portefeuilles hors ligne (cold storage). De plus, nous mettons en œuvre des protocoles de sécurité avancés pour protéger votre compte."
    },
    {
      id: 8,
      category: 'security',
      question: "Que faire si j'oublie mon mot de passe ?",
      answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe. Assurez-vous d'utiliser un mot de passe fort et unique."
    }
  ]

  const [activeCategory, setActiveCategory] = useState('general')
  const [openQuestion, setOpenQuestion] = useState<number | null>(null)

  const toggleQuestion = (id: number) => {
    setOpenQuestion(openQuestion === id ? null : id)
  }

  const filteredFaqItems = faqItems.filter(item => item.category === activeCategory)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navbar réutilisable */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4 bg-gradient-to-r from-cyan-900 to-blue-900">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Foire aux questions
            </span>
          </h1>
          <p className="text-xl text-cyan-100 max-w-3xl mx-auto">
            Trouvez des réponses à toutes vos questions sur notre plateforme
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Catégories */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {faqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center px-6 py-3 rounded-full border ${activeCategory === category.id ? 'border-cyan-500 bg-cyan-900 bg-opacity-30 text-cyan-400' : 'border-gray-700 text-gray-300 hover:border-gray-600'}`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {filteredFaqItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(item.id)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-800 transition"
                >
                  <h3 className="text-lg font-medium">{item.question}</h3>
                  <svg
                    className={`w-5 h-5 text-cyan-400 transform transition ${openQuestion === item.id ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openQuestion === item.id && (
                  <div className="px-6 pb-6 pt-2 text-gray-300 border-t border-gray-800">
                    <p>{item.answer}</p>
                    {item.id === 2 && (
                      <Link 
                        href="/register" 
                        className="inline-block mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md text-sm font-medium"
                      >
                        Créer un compte maintenant
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Support supplémentaire */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-4">Vous ne trouvez pas votre réponse ?</h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Notre équipe de support est disponible 24/7 pour répondre à toutes vos questions spécifiques.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg font-medium"
            >
              Contactez notre support
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      
      {/* Footer */}
      <Footer />
    </div>
  )
}