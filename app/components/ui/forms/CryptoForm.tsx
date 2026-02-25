'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import CryptoSelectField from '../../inputs/CryptoSelectField';
import InputField from '../../inputs/InputField';
import { AllFormProps } from '@/types';
import { useRouter } from 'next/navigation';
import { CryptoTransactionSchema, CryptoTransactionSchemaType } from '@/app/lib/validations/TransactionSchema';
import { Copy, Check, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { nowPaymentsService, NowPaymentsPayment, NowPaymentsPaymentStatus  } from '@/app/services/nowpayments';
import { zodResolver } from '@hookform/resolvers/zod';

interface WalletFormProps extends AllFormProps {
  onModalClose?: () => void;
  onSuccess?: (data?: any) => void;
  user_id: string;
  wallet: {
    id: string;
    balance: string;
  };
  userCurrency?: string;
  userEmail?: string;
}

interface CryptoOption {
  code: string;
  name: string;
}

// Options par défaut au cas où l'API échoue
const DEFAULT_CRYPTO_OPTIONS: CryptoOption[] = [
  { code: 'btc', name: 'Bitcoin (BTC)' },
  { code: 'eth', name: 'Ethereum (ETH)' },
  { code: 'usdt', name: 'Tether (USDT)' },
  { code: 'bnb', name: 'BNB (BNB)' },
  { code: 'usdc', name: 'USD Coin (USDC)' },
];

export default function CryptoForm({ type, id, user_id, wallet, userCurrency, userEmail, onSuccess, onModalClose }: WalletFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);
  const [payment, setPayment] = useState<NowPaymentsPayment | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<NowPaymentsPaymentStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>(DEFAULT_CRYPTO_OPTIONS);
  const [minAmount, setMinAmount] = useState<number>(1);
  const [isEstimating, setIsEstimating] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [estimationError, setEstimationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger,
    setError,
    clearErrors,
  } = useForm<CryptoTransactionSchemaType>({
    resolver: zodResolver(CryptoTransactionSchema),
    defaultValues: {
      user_id,
      wallet_id: wallet.id,
      amount: 0,
      crypto_currency: 'btc',
    },
  });

  const watchAmount = watch('amount');
  const watchCryptoCurrency = watch('crypto_currency');

  // Tester la connexion API au montage
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        console.log('Testing NowPayments API connection...');
        const connected = await nowPaymentsService.testConnection();
        setApiConnected(connected);
        if (!connected) {
          console.warn('NowPayments API connection failed');
          toast.warning('Payment service is temporarily unavailable. Please try again later.');
        } else {
          console.log('NowPayments API connection successful');
        }
      } catch (error) {
        console.error('API connection test failed:', error);
        setApiConnected(false);
        toast.warning('Payment service is temporarily unavailable. Please try again later.');
      }
    };

    testApiConnection();
  }, []);

  // Charger les cryptos disponibles au montage
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        console.log('Loading enabled currencies...');
        const currencies = await nowPaymentsService.getEnabledCurrencies();
        if (currencies.length > 0) {
          const options = currencies.map(currency => ({
            code: currency.code,
            name: `${currency.name} (${currency.code.toUpperCase()})`,
          }));
          setCryptoOptions(options);
          console.log(`Loaded ${options.length} currencies`);
        } else {
          console.warn('No currencies loaded, using defaults');
          setCryptoOptions(DEFAULT_CRYPTO_OPTIONS);
        }
      } catch (error) {
        console.error('Failed to load currencies, using defaults:', error);
        setCryptoOptions(DEFAULT_CRYPTO_OPTIONS);
      }
    };

    if (apiConnected !== false) {
      loadCurrencies();
    }
  }, [apiConnected]);

  // Effet pour récupérer le montant minimum et estimé
  useEffect(() => {
    const fetchAmounts = async () => {
      if (watchAmount && watchAmount > 0 && watchCryptoCurrency && apiConnected) {
        setIsEstimating(true);
        setEstimationError(null);
        
        try {
          console.log(`Fetching amounts for ${watchAmount} USD to ${watchCryptoCurrency}`);
          
          // Récupérer le montant minimum
          const minAmountData = await nowPaymentsService.getMinimumAmount('usd', watchCryptoCurrency);
          if (minAmountData) {
            console.log(`Minimum amount: ${minAmountData.min_amount}`);
            setMinAmount(minAmountData.min_amount);
          } else {
            console.warn('No minimum amount data received');
            setMinAmount(1); // Valeur par défaut
          }

          // Récupérer l'estimation
          const estimate = await nowPaymentsService.getEstimatedAmount(watchAmount, 'usd', watchCryptoCurrency);
          if (estimate && estimate.estimated_amount) {
            console.log(`Estimated amount: ${estimate.estimated_amount}`);
            setEstimatedAmount(estimate.estimated_amount);
          } else {
            console.warn('No estimate data received');
            setEstimatedAmount(null);
            setEstimationError('Unable to get exchange rate estimate');
          }
        } catch (error: any) {
          console.error('Error fetching amounts:', error);
          setEstimatedAmount(null);
          setEstimationError(error.message || 'Failed to fetch exchange rate');
        } finally {
          setIsEstimating(false);
        }
      } else {
        setEstimatedAmount(null);
        setEstimationError(null);
      }
    };

    // Utiliser un debounce pour éviter trop d'appels API
    const timeoutId = setTimeout(fetchAmounts, 1000);
    return () => clearTimeout(timeoutId);
  }, [watchAmount, watchCryptoCurrency, apiConnected]);

  // Effet pour vérifier le statut du paiement
  useEffect(() => {
    if (payment && payment.payment_status !== 'finished' && payment.payment_status !== 'failed' && payment.payment_status !== 'expired') {
      const interval = setInterval(async () => {
        try {
          console.log(`Checking payment status for: ${payment.payment_id}`);
          const status = await nowPaymentsService.getPaymentStatus(payment.payment_id);
          if (status) {
            setPaymentStatus(status);
            
            if (status.payment_status === 'finished') {
              console.log('Payment finished successfully');
              clearInterval(interval);
              toast.success('Payment completed successfully!');
              
              // Recharger la page pour mettre à jour le solde
              setTimeout(() => {
                router.refresh();
              }, 2000);
              
              if (onSuccess) {
                onSuccess(status);
              }
            } else if (status.payment_status === 'failed') {
              console.log('Payment failed');
              clearInterval(interval);
              toast.error('Payment failed. Please try again.');
            } else if (status.payment_status === 'expired') {
              console.log('Payment expired');
              clearInterval(interval);
              toast.error('Payment expired. Please create a new payment.');
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 15000); // Vérifier toutes les 15 secondes

      setStatusCheckInterval(interval);
      return () => clearInterval(interval);
    }
  }, [payment, onSuccess, router]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permettre les valeurs vides ou partielles
    if (value === '' || value === '.') {
      setValue('amount', 0 as any);
      return;
    }
    
    // Convertir en nombre et limiter à 2 décimales
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      // Arrondir à 2 décimales pour éviter les problèmes de validation
      const roundedValue = Math.round(numericValue * 100) / 100;
      setValue('amount', roundedValue);
    } else {
      setValue('amount', 0 as any);
    }
    
    trigger('amount');
    clearErrors('amount');
  };

  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // S'assurer que la valeur est valide lors du blur
    if (value === '' || value === '.' || parseFloat(value) === 0) {
      setValue('amount', 0 as any);
    } else {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        const roundedValue = Math.round(numericValue * 100) / 100;
        setValue('amount', roundedValue);
      }
    }
    
    trigger('amount');
  };

  const handleCryptoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setValue('crypto_currency', value as any);
    trigger('crypto_currency');
    setEstimatedAmount(null);
    setEstimationError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Fonction sécurisée pour formater les nombres
  const formatAmount = (amount: number | null | undefined, decimals: number = 8): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }
    
    try {
      // Convertir en nombre si c'est une string
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      if (isNaN(numAmount) || !isFinite(numAmount)) {
        return '0';
      }
      
      return numAmount.toFixed(decimals);
    } catch (error) {
      console.error('Error formatting amount:', error, amount);
      return '0';
    }
  };

const onSubmit = async (data: CryptoTransactionSchemaType) => {
  if (apiConnected === false) {
    toast.error('Payment service is currently unavailable. Please try again later.');
    return;
  }

  // Validation finale du montant
  if (!data.amount || data.amount < minAmount) {
    setError('amount', {
      type: 'manual',
      message: `Minimum amount is $${minAmount}`,
    });
    return;
  }

  setLoading(true);
  try {
    console.log('Creating payment with data:', data);

    // Test de connexion avant de créer le paiement
    const isConnected = await nowPaymentsService.testConnection();
    if (!isConnected) {
      throw new Error('Payment service is currently unavailable. Please try again later.');
    }

    // Créer le paiement via NowPayments
    const paymentData = await nowPaymentsService.createPayment({
      price_amount: data.amount,
      price_currency: 'usd',
      pay_currency: data.crypto_currency,
      order_id: `order_${Date.now()}_${user_id}_${wallet.id}`,
      order_description: `Deposit of $${data.amount} USD to wallet ${wallet.id}`,
      customer_email: userEmail,
    });

    if (!paymentData) {
      throw new Error('No payment data received from NowPayments');
    }

    setPayment(paymentData);
    
    // ENREGISTRER LA TRANSACTION IMMÉDIATEMENT avec statut PENDING
    const transactionResponse = await fetch('/api/transaction/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount,
        crypto_currency: data.crypto_currency,
        payment_id: paymentData.payment_id,
        pay_amount: paymentData.pay_amount,
        pay_address: paymentData.pay_address,
        network: paymentData.network,
        smart_contract: paymentData.smart_contract,
      }),
    });

    if (!transactionResponse.ok) {
      const errorData = await transactionResponse.json();
      throw new Error(errorData.error || 'Failed to create transaction record');
    }

    const transactionResult = await transactionResponse.json();
    
    toast.success('Payment address generated successfully! Transaction created with PENDING status.');
    console.log('Transaction created with PENDING status:', transactionResult);
    
  } catch (error: any) {
    console.error('Error creating payment:', error);
    
    let errorMessage = 'Failed to create payment. Please try again.';
    
    if (error.message.includes('HTML')) {
      errorMessage = 'Payment service configuration error. Please contact support.';
    } else if (error.message.includes('INVALID_API_KEY')) {
      errorMessage = 'Payment service configuration error. Please contact support.';
    } else if (error.message.includes('network error') || error.message.includes('Unable to connect')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('minimum amount')) {
      errorMessage = error.message;
    } else if (error.message.includes('INVALID_REQUEST_PARAMS')) {
      errorMessage = 'Payment service configuration error. Please contact support.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Payment service timeout. Please try again.';
    } else if (error.message.includes('BAD_CREATE_PAYMENT_REQUEST')) {
      errorMessage = 'Payment service configuration error. Please contact support.';
    } else if (error.message.includes('service is currently unavailable')) {
      errorMessage = error.message;
    } else if (error.message.includes('existe déjà')) {
      errorMessage = 'A transaction with this payment already exists.';
    }
    
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const resetPayment = () => {
    setPayment(null);
    setPaymentStatus(null);
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500 text-black';
      case 'confirming':
        return 'bg-blue-500 text-white';
      case 'finished':
        return 'bg-green-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'expired':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting for payment';
      case 'confirming':
        return 'Confirming transaction';
      case 'finished':
        return 'Payment completed';
      case 'failed':
        return 'Payment failed';
      case 'expired':
        return 'Payment expired';
      default:
        return status;
    }
  };

  const openInExplorer = (address: string, currency: string) => {
    let explorerUrl = '';
    
    switch (currency.toLowerCase()) {
      case 'btc':
        explorerUrl = `https://www.blockchain.com/explorer/addresses/btc/${address}`;
        break;
      case 'eth':
        explorerUrl = `https://etherscan.io/address/${address}`;
        break;
      case 'usdt':
        explorerUrl = `https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7?a=${address}`;
        break;
      case 'usdc':
        explorerUrl = `https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48?a=${address}`;
        break;
      case 'bnb':
        explorerUrl = `https://bscscan.com/address/${address}`;
        break;
      default:
        return;
    }
    
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className="w-full mx-auto p-6 rounded-lg shadow-md bg-gray-900">
      {apiConnected === false && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-md">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Payment service is temporarily unavailable. Please try again later.
          </p>
        </div>
      )}

      {!payment ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
                Amount to invest (in {userCurrency || 'USD'})
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max="100000"
                placeholder="Ex: 50.00"
                className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.amount 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-700 focus:ring-blue-500'
                }`}
                {...register('amount', {
                  valueAsNumber: true,
                  onChange: handleAmountChange,
                  onBlur: handleAmountBlur,
                })}
                disabled={apiConnected === false}
              />
              {errors.amount && (
                <p className="text-sm text-red-400">{errors.amount.message}</p>
              )}
            </div>

            <CryptoSelectField
              name="crypto_currency"
              label="Cryptocurrency"
              options={cryptoOptions}
              register={register}
              error={errors.crypto_currency}
              required
              valueKey="code"
              textKey="name"
              onChange={handleCryptoChange}
              disabled={apiConnected === false}
            />

            {minAmount > 1 && (
              <div className="text-sm text-yellow-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Montant minimum : {Math.ceil(minAmount)}$
              </div>
            )}

            {estimationError && (
              <div className="p-3 bg-red-900/20 border border-red-500 rounded-md">
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {estimationError}
                </p>
              </div>
            )}

            {estimatedAmount !== null && watchAmount && watchAmount >= minAmount && (
              <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                <p className="text-sm text-gray-300">
                  You will pay: <strong>{formatAmount(estimatedAmount)} {watchCryptoCurrency?.toUpperCase()}</strong>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Exchange rate: 1 USD = {formatAmount((estimatedAmount || 0) / watchAmount)} {watchCryptoCurrency?.toUpperCase()}
                </p>
                {isEstimating && (
                  <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Updating estimate...
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || isSubmitting || !watchAmount || watchAmount < minAmount || isEstimating || apiConnected === false}
            className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
              loading || isSubmitting || !watchAmount || watchAmount < minAmount || isEstimating || apiConnected === false
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading || isSubmitting ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                Creating Payment...
              </div>
            ) : (
              'Adresse de paiement genérée'
            )}
          </button>

          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 text-center">
              <p>Development mode: Webhook callbacks are disabled</p>
            </div>
          )}
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
              <Check className="h-5 w-5" />
              Instructions de paiement
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-300 mb-4 text-center">
                  Envoyez exactement <strong>{formatAmount(payment.pay_amount)} {payment.pay_currency.toUpperCase()}</strong> à l'adresse ci-dessous.
                </p>
                
                {/* QR Code */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCode 
                      value={payment.pay_address} 
                      size={200}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                </div>

                {/* Adresse de paiement */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Adresse de paiement
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-900 p-3 rounded text-sm break-all font-mono">
                      {payment.pay_address}
                    </code>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => copyToClipboard(payment.pay_address)}
                        className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors flex-shrink-0"
                        title="Copy address"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openInExplorer(payment.pay_address, payment.pay_currency)}
                        className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors flex-shrink-0"
                        title="View in explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Montant */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Montant à envoyer
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-900 p-3 rounded text-sm font-mono">
                      {formatAmount(payment.pay_amount)} {payment.pay_currency.toUpperCase()}
                    </code>
                    <button
                      onClick={() => copyToClipboard(payment.pay_amount.toString())}
                      className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors flex-shrink-0"
                      title="Copy amount"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Statut du paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Payment Status
                </label>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(paymentStatus?.payment_status || payment.payment_status)}`}>
                    {getPaymentStatusText(paymentStatus?.payment_status || payment.payment_status)}
                  </div>
                  {paymentStatus?.actually_paid && (
                    <span className="text-sm text-gray-300">
                      Reçu: {formatAmount(paymentStatus.actually_paid)} {payment.pay_currency.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Informations réseau */}
              {payment.network && (
                <div className="text-sm text-gray-400">
                  Réseau: <strong>{payment.network}</strong>
                </div>
              )}

              {payment.valid_until && (
                <div className="text-sm text-yellow-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                 Cette adresse expire à: {new Date(payment.valid_until).toLocaleString()}
                </div>
              )}

              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded">
                  <p>Mode développement : les mises à jour du statut de paiement sont manuelles. Utilisez le bouton d'actualisation ci-dessous.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetPayment}
              className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Créer un nouveau paiement
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Actualiser le statut
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Les paiements sont traités automatiquement. La confirmation peut prendre quelques minutes.</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="mt-1">En développement, vous devez vérifier manuellement l'état du paiement.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}