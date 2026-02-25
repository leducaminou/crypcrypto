import { title } from "process";

export const footerlabels: { label: string; herf: string }[] = [
  { label: "Terms", herf: "#" },
  { label: "Disclosures", herf: "#" },
  { label: "Disclosures", herf: "#" },
  { label: "Latest News", herf: "#" },
];

export const Companiesdata: { imgSrc: string }[] = [
  {
    imgSrc: "/images/companies/birdseye.svg",
  },
  {
    imgSrc: "/images/companies/break.svg",
  },
  {
    imgSrc: "/images/companies/keddar.svg",
  },
  {
    imgSrc: "/images/companies/shield.svg",
  },
  {
    imgSrc: "/images/companies/tandov.svg",
  },
  {
    imgSrc: "/images/companies/tree.svg",
  },
];

export const workdata: {
  imgSrc: string;
  heading: string;
  subheading: string;
}[] = [
  {
    imgSrc: "/images/work/icon-one.svg",
    heading: "Inscription Rapide",
    subheading:
      "Ouvrez votre compte en moins de 2 minutes. C'est simple, sécurisé et sans paperasse. faites votre premier dépot",
  },
  {
    imgSrc: "/images/work/icon-two.svg",
    heading: "Choisissez Votre Plan d'Investissement",
    subheading:
      "Choisissez un plan d'investissement. Chaque plan est optimisé par un algorithme d'IA spécifique pour maximiser les rendements.",
  },
  {
    imgSrc: "/images/work/icon-three.svg",
    heading: "Suivez & Retirez Vos Profits",
    subheading:
      "Observez votre capital croître quotidiennement sur votre tableau de bord personnel. Retirez vos intérêts à tout moment, ou réinvestissez-les ",
  },
];

export const Featuresdata: {
  imgSrc: string;
  heading: string;
  subheading: string;
}[] = [
  {
    imgSrc: "/images/features/featureTwo.svg",
    heading: "Efficacité",
    subheading:
      "Notre système d'IA analyse des terabytes de données de marché, des sentiments sur les réseaux sociaux et des indicateurs techniques pour prendre des décisions de trading éclairées et ultra-rapides, bien au-delà des capacités humaines.",
  },
  {
    imgSrc: "/images/features/featureOne.svg",
    heading: "Transparence",
    subheading:
      "Vos fonds et vos données sont notre priorité absolue. Nous utilisons un cold storage pour 98% des actifs et des smart contracts audités. L'historique de toutes les transactions et performances de l'IA est accessible sur votre dashboard.",
  },
  {
    imgSrc: "/images/features/featureThree.svg",
    heading: "Revenus Quotidiens Garantis",
    subheading:
      "Contrairement au trading traditionnel, notre IA génère des rendements constants, quelle que soit la volatilité du marché. Recevez vos profits chaque jour, directement sur votre compte.",
  },
];

export const Faqdata: { heading: string; subheading: string }[] = [
  {
    heading: "1. Comment puis-je créer un compte ?",
    subheading:
      "C'est simple et rapide ! Cliquez sur le bouton \"S'inscrire\" en haut de la page, renseignez votre adresse e-mail et créez un mot de passe sécurisé. Une fois votre e-mail vérifié, vous pouvez accéder à votre tableau de bord et commencer à investir.",
  },
  {
    heading: "2. Comment puis-je effectuer un dépôt ?",
    subheading:
      'Depuis votre tableau de bord, rendez-vous dans la section "Portefeuille" et cliquez sur "Déposer". Choisissez paiement mobile ou paiement par crypto, envoyez les fonds à l\'adresse unique qui vous est fournie ou au numéro mobile fourni, et votre compte sera crédité après confirmation du réseau. ',
  },
  
  {
    heading:
      "3. Combien de temps prennent les dépôts et les retraits ?",
    subheading:
    "Dépôts : Ils sont généralement crédités après 1 à 3 confirmations du réseau blockchain.\nRetraits : Nous traitons toutes les demandes de retrait manuellement pour des raisons de sécurité dans un délai de 24 heures. Ensuite, la transaction nécessite quelques confirmations sur le réseau. Vous recevrez vos fonds sous 24 à 48 heures maximum.",
    },
  
];


export const Faqdataplus: { heading: string; subheading: string }[] = [
  
  {
    heading:
      "4. Puis-je retirer mon capital investi à tout moment ?",
    subheading:
    "Le capital est verrouillé jusqu'à la fin de la durée du plan. Les intérêts gagnés sont toujours disponibles pour retrait, selon le calendrier de votre plan.",
    },
    {
    heading: "5. Comment fonctionne exactement votre IA de trading ?",
    subheading: 
    "Notre IA utilise une combinaison de Machine Learning, d'analyse de sentiment (réseaux sociaux, actualités) et d'analyse technique avancée. Elle scanne des milliers de paires de trading et d'indicateurs en temps réel pour identifier des opportunités de trading à fort potentiel et exécuter les ordres en une microseconde, bien avant la plupart des traders.",
   },

    {
    heading: "6. Mes fonds sont-ils en sécurité ?",
    subheading: 
    "La sécurité est notre priorité absolue. 98% des fonds des utilisateurs sont stockés hors ligne dans des portefeuilles multisignatures non détenus par la plateforme. Nos smart contracts et nos stratégies de sécurité sont régulièrement audités par des firmes externes. : Nous utilisons le chiffrement SSL de niveau bancaire et une authentification à deux facteurs (2FA) pour protéger tous les comptes.",
   },

    {
    heading: "7. Puis-je voir l'historique des trades effectués par l'IA ?",
    subheading: 
    "Pour des raisons de sécurité et de protection de notre algorithme propriétaire, nous ne divulguons pas l'historique détaillé et en temps réel des trades. Cependant, vous pouvez suivre la performance globale de votre investissement et les intérêts générés quotidiennement sur votre tableau de bord personnel.",
   },

    {
    heading: "8.  Les rendements quotidiens sont-ils garantis ?",
    subheading: 
    "Les rendements annoncés sont basés sur les performances historiques de notre algorithme. Bien que notre IA soit conçue pour être extrêmement performante, les marchés des cryptomonnaies sont intrinsèquement volatils et aucun rendement futur ne peut être garanti. Les performances passées ne préjugent pas des résultats futurs.",
   },
   
    {
    heading: "9. Que se passe-t-il à la fin de mon plan d'investissement ?",
    subheading: 
    "À l'échéance de votre plan, votre capital initial (ainsi que les tous derniers intérêts) est automatiquement crédité sur le solde de votre portefeuille sur la plateforme. Vous êtes alors libre de le retirer ou de le réinvestir dans un nouveau plan.",
   },
   
    {
    heading: "10. Puis-je avoir plusieurs plans d'investissement actifs en même temps ?",
    subheading: 
    "Absolument. Vous pouvez souscrire à plusieurs plans simultanément, tant que vous respectez le montant minimum d'investissement pour chacun. C'est une excellente stratégie pour diversifier votre portefeuille.",
   },
   
    {
    heading: "11.  Que faire si j'oublie mon mot de passe ?",
    subheading: 
    "Sur la page de connexion, cliquez sur \"Mot de passe oublié ?\". Vous recevrez un e-mail avec un lien sécurisé pour réinitialiser votre mot de passe.",
   },
   
    {
    heading: "12. Comment contacter le service client ?",
    subheading: 
    "Notre équipe de support dédiée est disponible 24h/24 et 7j/7. Vous pouvez nous contacter via : Chat en direct directement sur la plateforme. E-mail : support@juatradx.com Formulaire de contact dans la section \"Support\" de votre tableau de bord.",
   },
   
];
