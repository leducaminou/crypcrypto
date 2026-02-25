/**
 * Copie un texte dans le presse-papier avec fallback pour les anciens navigateurs
 * @param text Le texte à copier
 * @returns Une promesse résolue quand la copie est terminée
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    // Méthode moderne
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return
    }

    // Fallback pour anciens navigateurs
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed' // Évite le défilement
    document.body.appendChild(textArea)
    textArea.select()

    const success = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (!success) {
      throw new Error('La copie a échoué')
    }
  } catch (err) {
    console.error('Erreur lors de la copie:', err)
    throw err // Propage l'erreur pour que le composant puisse la gérer
  }
}