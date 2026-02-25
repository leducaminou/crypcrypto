// app/invest/page.tsx
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/app/components/ui/Navbar'
import Footer from '@/app/components/ui/Footer'
import ProfitCalculator from '@/app/components/pages/ProfitCalculator'

export default function InvestPage() {
  // Plans d'investissement
  const investmentPlans = [
    {
      name: "Starter",
      min: 50,
      max: 999,
      dailyReturn: 1.8,
      term: "30 jours",
      totalReturn: 154,
      featured: false
    },
    {
      name: "Advanced",
      min: 1000,
      max: 4999,
      dailyReturn: 2.2,
      term: "45 jours",
      totalReturn: 199,
      featured: true
    },
    {
      name: "Professional",
      min: 5000,
      max: 19999,
      dailyReturn: 2.8,
      term: "60 jours",
      totalReturn: 268,
      featured: false
    },
    {
      name: "VIP",
      min: 20000,
      max: 100000,
      dailyReturn: 3.5,
      term: "90 jours",
      totalReturn: 415,
      featured: false
    }
  ]

  // Méthodes de paiement
  const paymentMethods = [
    { name: "Bitcoin", icon: "/crypto/bitcoin.png" },
    { name: "Ethereum", icon: "/crypto/ethereum.png" },
    { name: "USDT", icon: "/crypto/usdt.png" },
    { name: "Perfect Money", icon: "/crypto/perfectmoney.png" },
    { name: "Payeer", icon: "/crypto/payeer.png" },
    { name: "Visa/Mastercard", icon: "/crypto/creditcard.png" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
       {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Programme d'investissement
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choisissez votre plan et commencez à générer des profits dès aujourd'hui
          </p>
        </div>
      </section>

      {/* Investment Plans */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {investmentPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative p-6 rounded-xl border ${plan.featured ? 'border-cyan-500 bg-gray-900' : 'border-gray-700 bg-gray-900'} transition hover:shadow-lg hover:shadow-cyan-500/10`}
              >
                {plan.featured && (
                  <div className="absolute top-0 right-0 bg-cyan-500 text-gray-900 px-3 py-1 rounded-bl-lg rounded-tr-xl text-xs font-bold">
                    RECOMMANDÉ
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-3 ${plan.featured ? 'text-cyan-400' : 'text-white'}`}>
                  {plan.name}
                </h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between pb-2 border-b border-gray-800">
                    <span className="text-gray-400">Investissement min:</span>
                    <span>${plan.min}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-800">
                    <span className="text-gray-400">Investissement max:</span>
                    <span>${plan.max}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-800">
                    <span className="text-gray-400">Retour quotidien:</span>
                    <span className="text-cyan-400 font-medium">{plan.dailyReturn}%</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-800">
                    <span className="text-gray-400">Durée:</span>
                    <span>{plan.term}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-800">
                    <span className="text-gray-400">Retour total:</span>
                    <span className="font-bold">{plan.totalReturn}%</span>
                  </div>
                </div>
                
                <Link
                  href={`/invest/plan?name=${encodeURIComponent(plan.name)}`}
                  className={`block w-full py-3 text-center rounded-lg font-medium ${plan.featured ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-gray-700 hover:bg-gray-600'} transition`}
                >
                  Choisir ce plan
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 px-4 bg-gray-800 bg-opacity-50">
        <ProfitCalculator />
      </section>

      {/* Payment Methods */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Méthodes de paiement</h2>
          <p className="text-gray-400 text-center mb-10">Nous acceptons les paiements via</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {paymentMethods.map((method, index) => (
              <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 relative mb-3">
                  <Image 
                    src={method.icon}
                    alt={method.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-center">{method.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-cyan-900 to-blue-900">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à commencer ?</h2>
          <p className="text-xl text-cyan-100 max-w-2xl mx-auto mb-8">
            Rejoignez des milliers d'investisseurs satisfaits et développez votre capital dès aujourd'hui.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/register" 
              className="px-8 py-3 bg-white text-cyan-900 hover:bg-gray-100 rounded-lg font-bold"
            >
              Ouvrir un compte
            </Link>
            <Link 
              href="/contact" 
              className="px-8 py-3 border border-white text-white hover:bg-cyan-800 rounded-lg font-bold"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      
      {/* Footer */}
      <Footer />
    </div>
  )
}