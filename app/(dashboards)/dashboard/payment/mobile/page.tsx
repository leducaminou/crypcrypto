'use client'

import PageLoadingSpiner from '@/app/components/ui/PageLoadingSpiner'
import SectionError from '@/app/components/ui/SectionError'
import SectionLoadingSpinner from '@/app/components/ui/SectionLoadingSpinner'
import { useIdContext } from '@/app/components/wrapper/ClientWrapper'
import { Roles } from '@/app/lib/auth.config'
import { MtnName, MtnNumber, OrangeName, OrangeNumber } from '@/app/lib/constants'
import { useRoleGuard } from '@/app/lib/utils/role-guard'
import { useToast } from '@/hooks/use-toast'
import { UserResponse } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, useRef } from 'react'

interface PaymentParams {
  amount: string | null
  paymentAccountId: string | null
  transactionId: string | null
  countryCode: string | null
}

interface PaymentAccountResponse {
  id: string;
  type: string;
  account_identifier: string;
  provider: "Orange Money" | "MTN Money"; // Restreindre à ces deux valeurs
  is_default: boolean;
  user: {
    country: {
      name: string;
    } | null;
  };
}

const InputAllFile = ({
  label,
  onFileChange,
  acceptedTypes = 'image/*,.pdf',
}: {
  label: string
  onFileChange: (file: File | null) => void
  acceptedTypes?: string
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onFileChange(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-gray-400">{label}</label>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedTypes}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition duration-200"
      >
        Choisir un fichier
      </button>
    </div>
  )
}

const MobilePaymentPage = () => {
  useRoleGuard([Roles.USER])
  const id = useIdContext()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentParams, setPaymentParams] = useState<PaymentParams>({
    amount: null,
    paymentAccountId: null,
    transactionId: null,
    countryCode: null
  })

  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccountResponse | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [localAmount, setLocalAmount] = useState<number | null>(null);
  const [localCurrency, setLocalCurrency] = useState<string | null>(null);

  const [mobileName, setMobileName] = useState<string | null>(null)



  useEffect(() => {


    if (paymentAccount?.provider === 'Orange Money') {
      setMobileName(OrangeName)
    }  
    
    if (paymentAccount?.provider === 'MTN Money') {
      setMobileName(MtnName)
    } 

  }, [paymentAccount]);

  // Fetch currency conversion for USSD
  useEffect(() => {
    const fetchConversion = async () => {
      if (paymentParams.amount && paymentParams.countryCode) {
        try {
          const res = await fetch(`/api/currencies/convert?countryCode=${paymentParams.countryCode}&usdAmount=${paymentParams.amount}`);
          if (res.ok) {
            const data = await res.json();
            setLocalAmount(data.local);
            setLocalCurrency(data.currency);
          }
        } catch (e) {
          console.error('Failed to fetch conversion', e);
        }
      }
    };
    fetchConversion();
  }, [paymentParams.amount, paymentParams.countryCode]);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!id) {
          throw new Error('User ID is not available');
        }
        const response = await fetch(`/api/user/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            response.status === 404 ? 'User not found' : `Failed to fetch user: ${errorText}`
          );
        }

        const data: UserResponse = await response.json();
        setUser(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        showError(errorMessage);
      }
    };

    if (id) {
      fetchUser();
    } else {
      setError('User ID is not available');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const fetchPaymentAccount = async () => {
      try {
        if (!paymentParams.paymentAccountId) {
          throw new Error('Payment account ID is not available');
        }

        const response = await fetch(`/api/payment-account/${paymentParams.paymentAccountId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            response.status === 404 ? 'Payment account not found' : `Failed to fetch payment account: ${errorText}`
          );
        }

        const data: PaymentAccountResponse = await response.json();
        setPaymentAccount(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        showError(errorMessage);
      }
    };

    if (paymentParams.paymentAccountId) {
      fetchPaymentAccount();
    }
  }, [paymentParams.paymentAccountId]);

  useEffect(() => {
    if (searchParams) {
      const params: PaymentParams = {
        amount: searchParams.get('amount'),
        paymentAccountId: searchParams.get('paymentAccountId'),
        transactionId: searchParams.get('transactionId'),
        countryCode: searchParams.get('countryCode')
      }

      setPaymentParams(params)
      setLoading(false)

      if (!params.amount || !params.paymentAccountId || !params.countryCode) {
        console.error('Paramètres manquants dans l\'URL')
        // Redirection ou gestion d'erreur si nécessaire
        // router.push('/dashboard/wallet')
      }
    }
  }, [searchParams, router])

  const initiateUSSDCall = () => {
    if (!paymentParams.amount || !paymentAccount) {
      showError('Les informations de paiement sont incomplètes');
      return;
    }




    let ussdCode: string = '';
    const amountToPay = localAmount || paymentParams.amount; // Use local currency if available

    // Utilisez des conditions séparées au lieu d'imbriquer
    if (paymentAccount.provider === 'Orange Money') {
      ussdCode = `#150*11*${OrangeNumber}*${amountToPay}#`;
    } else if (paymentAccount.provider === 'MTN Money') {
      ussdCode = `*126**1*1*${MtnNumber}*${amountToPay}*1#`;
    } else {
      showError('Opérateur mobile non pris en charge');
      return;
    }


    const telLink = `tel:${encodeURIComponent(ussdCode)}`;

    // Solution pour iOS et Android
    window.location.href = telLink;

    // Solution alternative pour certains navigateurs
    const anchor = document.createElement('a');
    anchor.href = telLink;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleConfirmPayment = async () => {
    if (!paymentParams.transactionId) {
      showError('ID de transaction manquant');
      return;
    }

    if (!proofFile) {
      showError('Veuillez télécharger une preuve de paiement');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload du fichier via l'API
      const formData = new FormData();
      formData.append('file', proofFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Échec de l\'upload du fichier');
      }

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success || !uploadResult.filePath) {
        throw new Error('Le chemin du fichier est manquant');
      }

      // Mise à jour de la transaction
      const updateResponse = await fetch(`/api/transaction/update/proof/${paymentParams.transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof_of_payment: uploadResult.filePath // Déjà au bon format
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Error details:', errorData);
        throw new Error('Échec de la mise à jour de la transaction');
      }

      showSuccess('Paiement confirmé avec succès');
      router.push('/dashboard/wallet');
    } catch (error) {
      console.error('Error confirming payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
 

   if (!paymentAccount || loading) return <SectionLoadingSpinner />

  if (error) return <SectionError error={error} />;

  return (
    <div className="w-full flex flex-col gap-4 text-white mt-28">
      <h1 className="text-2xl font-bold mb-6">Paiement Mobile</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-col gap-4 bg-gray-800 rounded-lg p-6 w-full md:w-1/3">
          <span className="text-gray-400">Pays:</span>
          <span className="font-medium">
            {user?.user?.country?.name || 'Non spécifié'}
          </span>

          <span className="text-gray-400">Montant:</span>
          <span className="font-medium text-xl text-cyan-400">
            ${paymentParams.amount} USD {localAmount && localCurrency ? <span className="text-sm text-gray-300 ml-1">(≈ {localAmount.toLocaleString()} {localCurrency})</span> : ''}
          </span>

          <span className="text-gray-400">Compte:</span>
          <span className="font-medium">
            {paymentAccount?.account_identifier || 'Non disponible'}
          </span>

          <span className="text-gray-400">Opérateur:</span>
          <span className="font-medium">
            {paymentAccount?.provider || 'Non disponible'}
          </span>

          <div className="mt-6">
            <button
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md transition duration-200"
              onClick={initiateUSSDCall}
            >
              Ajouter les fonds
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-gray-800 rounded-lg p-6 w-full md:w-2/3">
          {paymentAccount?.provider === 'Orange Money' ? (
            <div>
              <h2 className="text-xl font-bold mb-2">Instructions pour {paymentAccount?.provider} {user?.user?.country?.name || ''}</h2>
              <div className="bg-yellow-900/40 border border-yellow-500/50 p-4 rounded-md mb-6 inline-block">
                <p className="text-yellow-400 font-bold mb-1">Montant exact à transférer :</p>
                <p className="text-2xl font-black text-white">{localAmount ? `${localAmount.toLocaleString()} ${localCurrency}` : `${paymentParams.amount} USD`}</p>
              </div>
              <p className="mb-2">1. Cliquez sur "Ajouter les fonds" pour composer automatiquement le code USSD</p>

              <p>2. Validez le paiement sur votre téléphone au compte ({mobileName})</p>



              <p>3. Uploadez une capture d'écran du message de paiement ou tout autre preuve</p>
              <p>4. Cliquez sur confirmer le paiement</p>
              <p>5. Après confirmation nous allons valider votre paiement</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-2">Instructions pour {paymentAccount?.provider}</h2>
              <div className="bg-yellow-900/40 border border-yellow-500/50 p-4 rounded-md mb-6 inline-block">
                <p className="text-yellow-400 font-bold mb-1">Montant exact à transférer :</p>
                <p className="text-2xl font-black text-white">{localAmount ? `${localAmount.toLocaleString()} ${localCurrency}` : `${paymentParams.amount} USD`}</p>
              </div>
              <p className="mb-2">1. Cliquez sur "Ajouter les fonds" pour composer automatiquement le code USSD</p>
              <p className="mb-2">2. Validez le paiement sur votre téléphone au compte ({mobileName})</p>
              <p className="mb-2">3. Uploadez une capture d'écran du message de paiement ou tout autre preuve</p>
              <p className="mb-2">4. Cliquez sur confirmer le paiement</p>
              <p>5. Après confirmation nous allons valider votre paiement</p>
            </div>
          )}

          <div className="mt-4">
            <InputAllFile
              label="Capture d'écran du message ou preuve de paiement"
              onFileChange={setProofFile}
              acceptedTypes="image/*,.pdf"
            />

            {proofFile && (
              <div className="mt-2 text-sm text-gray-300">
                Fichier sélectionné: {proofFile.name}
              </div>
            )}

            <button
              onClick={handleConfirmPayment}
              disabled={!proofFile || isSubmitting}
              className={`w-full mt-4 py-2 px-4 rounded-md transition duration-200 cursor-pointer ${!proofFile || isSubmitting
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Confirmer le paiement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobilePaymentPage