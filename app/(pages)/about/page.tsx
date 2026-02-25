// app/about/page.tsx
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/app/components/ui/Navbar'
import Footer from '@/app/components/ui/Footer'

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Jean Dupont',
      role: 'Fondateur & CEO',
      bio: 'Expert en marchés financiers avec 15 ans d\'expérience dans les investissements alternatifs.',
      image: '/team/jean-dupont.jpg'
    },
    {
      name: 'Marie Lambert',
      role: 'Directrice Financière',
      bio: 'Spécialiste en gestion de portefeuilles et analyse de risques.',
      image: '/team/marie-lambert.jpg'
    },
    {
      name: 'Thomas Martin',
      role: 'CTO',
      bio: 'Architecte des solutions technologiques sécurisées de la plateforme.',
      image: '/team/thomas-martin.jpg'
    }
  ]

  const milestones = [
    { year: '2018', event: "Fondation de Jua Trad'X" },
    { year: '2019', event: 'Lancement de la première plateforme' },
    { year: '2020', event: 'Atteinte des 10 000 utilisateurs' },
    { year: '2022', event: 'Extension aux marchés internationaux' },
    { year: '2023', event: 'Lancement de l\'application mobile' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navbar réutilisable */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4 bg-gradient-to-r from-cyan-900 to-blue-900">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              À propos de Jua Trad'X
            </span>
          </h1>
          <p className="text-xl text-cyan-100 max-w-3xl mx-auto">
            Découvrez notre vision, notre équipe et notre engagement pour votre
            réussite financière
          </p>
        </div>
      </section>

      {/* Notre histoire */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                  Notre histoire
                </span>
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  Fondée en 2018, Jua Trad'X est née de la volonté de
                  démocratiser l'accès à des opportunités d'investissement
                  alternatives autrefois réservées à une élite financière.
                </p>
                <p>
                  Notre plateforme a été conçue par des experts des marchés
                  financiers et des technologies blockchain pour offrir une
                  expérience d'investissement transparente et performante.
                </p>
                <p>
                  Aujourd'hui, nous accompagnons des milliers d'investisseurs
                  dans plus de 30 pays à travers le monde.
                </p>
              </div>
            </div>
            <div className="relative h-80 rounded-xl overflow-hidden border border-gray-700">
              <Image
                src="/about/office.jpg"
                alt="Nos bureaux"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Notre mission */}
      <section className="py-20 bg-gray-800 bg-opacity-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Notre mission
            </span>
          </h2>
          <div className="max-w-4xl mx-auto bg-gray-900 p-8 rounded-xl border border-gray-700">
            <p className="text-xl italic text-gray-300 mb-6">
              "Rendre accessible à tous des stratégies d'investissement
              sophistiquées avec des rendements attractifs, tout en maintenant
              les plus hauts standards de sécurité et de transparence."
            </p>
            <div className="text-cyan-400 font-medium">
              — L'équipe Jua Trad'X
            </div>
          </div>
        </div>
      </section>

      {/* Notre équipe */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Rencontrez notre équipe
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-cyan-500 transition"
              >
                <div className="relative h-60">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <div className="text-cyan-400 mb-3">{member.role}</div>
                  <p className="text-gray-400">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notre parcours */}
      <section className="py-20 bg-gray-800 bg-opacity-30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Notre parcours
            </span>
          </h2>

          <div className="relative max-w-3xl mx-auto">
            {/* Ligne de temps */}
            <div className="absolute left-1/2 h-full w-0.5 bg-gradient-to-b from-cyan-500 to-blue-600 transform -translate-x-1/2"></div>

            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`relative mb-12 ${
                  index % 2 === 0 ? "pr-10 text-right" : "pl-10 text-left"
                }`}
              >
                <div
                  className={`absolute top-0 w-4 h-4 rounded-full bg-cyan-500 ${
                    index % 2 === 0 ? "-right-2" : "-left-2"
                  }`}
                ></div>
                <div
                  className={`inline-block p-6 rounded-lg border border-gray-700 bg-gray-900 ${
                    index % 2 === 0 ? "ml-auto" : "mr-auto"
                  }`}
                  style={{ maxWidth: "calc(50% - 20px)" }}
                >
                  <div className="text-cyan-400 font-bold mb-1">
                    {milestone.year}
                  </div>
                  <div>{milestone.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-cyan-900 to-blue-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à nous rejoindre ?</h2>
          <p className="text-xl text-cyan-100 max-w-2xl mx-auto mb-10">
            Commencez votre voyage d'investissement avec Jua Trad'X dès
            aujourd'hui.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-cyan-900 hover:bg-gray-100 rounded-lg font-bold text-lg"
            >
              Ouvrir un compte
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border border-white text-white hover:bg-cyan-800 rounded-lg font-bold text-lg"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}