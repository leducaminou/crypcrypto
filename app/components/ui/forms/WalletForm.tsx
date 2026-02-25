'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import InputField from '../../inputs/InputField'
import SubmitFormButton from '../SubmitFormButton'
import { useToast } from '@/hooks/use-toast'
import { AllFormProps } from '@/types'
import { WalletSchema, WalletShemaType, WalletFormInput } from '@/app/lib/validations/WalletSchema'
import { useRouter } from 'next/navigation'
import SelectFieldWithObject from '../../inputs/SelectFieldWithObject'
import Link from 'next/link'
import SectionLoadingSpinner from '../SectionLoadingSpinner'

interface WalletFormProps extends AllFormProps {
  onModalClose?: () => void;
  onSuccess?: (data?: any) => void;
  user_id: string;
  wallet: {
    id: string;
    balance: string;
  };
  userCountry: UserCountry
}

interface UserCountry {
  id?: string;
  dial_code?: string;
  country_code?: string;
  
}

interface ApiPaymentAccount {
  id: string;
  user_id: string;
  type: string;
  account_identifier: string;
  provider: string;
}

interface TransactionResponse {
  id: string;
  user_id: string;
  wallet_id: string;
  payment_account_id: string | null;
  amount: string;
  type: string;
  status: string;
  
  reference: string;
  created_at: string;
  updated_at: string;
}

const WalletForm = ({ type, id, user_id, wallet, onSuccess, userCountry, onModalClose }: WalletFormProps) => {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger
  } = useForm<WalletFormInput>({
    resolver: zodResolver(WalletSchema),
    defaultValues: {
      user_id,
      wallet_id: wallet.id,
      payment_account_id: "",
      amount: "" // Initialiser comme string vide
    }
  })

  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [paymentAccounts, setPaymentAccounts] = useState<ApiPaymentAccount[]>([])
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<ApiPaymentAccount | null>(null)

  const fetchPaymentAccounts = useCallback(async () => {
    try {
      const response = await fetch(`/api/user/payment-account/${user_id}`)
      if (!response.ok) throw new Error("Failed to fetch payment accounts")
      const data = await response.json()
      setPaymentAccounts(data)
    } catch (error) {
      console.error("Error fetching payment accounts:", error)
      showError("Failed to load payment accounts")
    } finally {
      setLoading(false)
    }
  }, [user_id, showError])

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchPaymentAccounts(),
      ])
    }
    fetchData()
  }, [fetchPaymentAccounts])

  const filteredPaymentAccounts = useMemo(() => {
    return paymentAccounts.filter(account => account.type === 'MOBILE')
  }, [paymentAccounts])

  const mergedPaymentAccounts = useMemo(() => {
    return filteredPaymentAccounts.map(account => ({
      id: account.id,
      title: `${account.provider} - ${account.account_identifier}`,
      type: account.type,
    }))
  }, [filteredPaymentAccounts])

  const handlePaymentAccountChange = (value: string) => {
    const account = paymentAccounts.find(acc => acc.id === value)
    setSelectedPaymentAccount(account || null)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Pour les inputs number, on garde la valeur comme string et la conversion se fera dans Zod
    setValue('amount', value, { shouldValidate: true })
  }

  const onSubmit = async (formData: WalletFormInput) => {
    try {
      setLoading(true)
      
      // Zod va transformer les données, donc on les envoie telles quelles
      const response = await fetch('/api/transaction/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: formData.user_id,
          wallet_id: formData.wallet_id,
          payment_account_id: formData.payment_account_id,
          amount: formData.amount, // Zod s'occupe de la conversion
          type: 'DEPOSIT',
          status: 'PENDING',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create transaction')
      }

      const transaction: TransactionResponse = await response.json()
      showSuccess('Transaction créée avec succès !')

      if (selectedPaymentAccount?.type === 'MOBILE') {
        router.push(`/dashboard/payment/mobile?amount=${formData.amount}&paymentAccountId=${selectedPaymentAccount.id}&countryCode=${userCountry?.country_code}&transactionId=${transaction.id}`)
      } else if (onSuccess) {
        onSuccess(transaction)
      }

      if (onModalClose) onModalClose()
    } catch (error: any) {
      console.error('Erreur:', error)
      showError(error.message || 'Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <SectionLoadingSpinner/>;


  if(filteredPaymentAccounts.length === 0 ) return (

 <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500 transition">
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">
                Vous n'avez enregistré aucune méthode de paiement mobile
              </p>
              <Link
                href="/dashboard/profile"
                className="text-cyan-400 hover:text-cyan-300 text-sm"
              >
                Completer le profile →
              </Link>
            </div>
          </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-16" noValidate>
      <h1 className="font-semibold text-lg">Nouveau dépot mobile</h1>

      <InputField
        id="amount"
        name="amount"
        type="number"
        label="Montant ($ USD)"
        placeholder={`Ex: 100`}
        required
        register={register}
        error={errors.amount}
        step="0.01"
        onChange={handleAmountChange}
      />
      <SelectFieldWithObject
        options={mergedPaymentAccounts}
        label="Compte de paiement"
        placeholder="Sélectionnez un compte"
        name="payment_account_id"
        register={register}
        error={errors.payment_account_id}
        full
        required
        valueKey="id"
        textKey="title"
        onChange={(value) => {
          handlePaymentAccountChange(value);
          setValue('payment_account_id', value, { shouldValidate: true });
        }}
      />
      <div>
        <SubmitFormButton
          submitting={isSubmitting || loading}
          type={type}
          title="Suivant"
          disabled={isSubmitting || loading}
        />
      </div>
    </form>
  )
}

export default WalletForm