const NOWPAYMENTS_API_KEY = "JYE7437-NERMG3B-NB4MP2N-Y5DQHZY";
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1'; // Production
// const NOWPAYMENTS_BASE_URL = 'https://api-sandbox.nowpayments.io/v1'; // Sandbox

export interface NowPaymentsCurrency {
  id: number;
  code: string;
  name: string;
  enabled: boolean;
  is_fiat: boolean;
}

export interface NowPaymentsMinAmount {
  currency_from: string;
  currency_to: string;
  min_amount: number;
}

export interface NowPaymentsEstimate {
  currency_from: string;
  currency_to: string;
  amount: number;
  estimated_amount: number;
}

export interface NowPaymentsPayment {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
  ipn_callback_url?: string;
  created_at: string;
  updated_at: string;
  purchase_id?: string;
  amount_received?: number;
  payin_extra_id?: string;
  smart_contract?: string;
  network?: string;
  network_precision?: number;
  time_limit?: number;
  expiration_estimate_date?: string;
  is_fixed_rate?: boolean;
  is_fee_paid_by_user?: boolean;
  valid_until?: string;
}

export interface NowPaymentsPaymentStatus {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  payin_extra_id?: string;
  actually_paid?: number;
  actually_paid_at_fiat?: number;
  outcome_amount?: number;
  outcome_currency?: string;
  purchase_id?: string;
  order_id?: string;
  order_description?: string;
  payin_hash?: string;
  payout_hash?: string;
  created_at: string;
  updated_at: string;
  type: string;
  payment_extra_ids?: string;
  smart_contract?: string;
  network?: string;
  network_precision?: number;
}

export interface NowPaymentsError {
  status: boolean;
  statusCode: number;
  code: string;
  message: string;
}

interface NowPaymentsStatusResponse {
  message: string;
}

interface NowPaymentsCurrenciesResponse {
  currencies: NowPaymentsCurrency[];
}

class NowPaymentsService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = NOWPAYMENTS_API_KEY || '';
    this.baseURL = NOWPAYMENTS_BASE_URL;
    
    if (!this.apiKey) {
      console.warn('NowPayments API key is not configured');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('NowPayments API key is not configured');
    }

    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      console.log(`Making NowPayments API request to: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      // Vérifier d'abord le content-type avant de parser le JSON
      const contentType = response.headers.get('content-type');
      const responseText = await response.text();
      
      // Vérifier si la réponse est du HTML (erreur)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('NowPayments API returned HTML instead of JSON:', responseText.substring(0, 500));
        throw new Error(`NowPayments API configuration error: Received HTML response. Check API key and endpoint. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        let errorMessage = `NowPayments API error: ${response.status} ${response.statusText}`;
        
        // Essayer de parser l'erreur comme JSON
        try {
          const errorData = JSON.parse(responseText) as NowPaymentsError;
          errorMessage = `NowPayments API error: ${response.status} - ${errorData.code || 'UNKNOWN'} - ${errorData.message || 'Unknown error'}`;
        } catch (parseError) {
          // Si le parsing JSON échoue, utiliser le texte brut
          errorMessage = `NowPayments API error: ${response.status} - ${responseText.substring(0, 200)}`;
        }
        
        console.error('NowPayments API error details:', {
          status: response.status,
          statusText: response.statusText,
          url,
          contentType,
          errorMessage
        });
        
        throw new Error(errorMessage);
      }

      // Vérifier que la réponse est bien du JSON avant de parser
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', responseText.substring(0, 500));
        throw new Error(`API returned non-JSON response: ${contentType}. Possible API configuration issue.`);
      }

      // Parser la réponse JSON
      const data = JSON.parse(responseText) as T;
      console.log(`NowPayments API response from ${url}:`, data);
      return data;
    } catch (error: any) {
      console.error(`NowPayments API request failed for ${url}:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('NowPayments API request timeout (30s)');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to NowPayments API. Check your internet connection.');
      } else if (error.message.includes('API returned non-JSON')) {
        throw error; // Propager l'erreur existante
      } else if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`NowPayments API error: ${error.message || 'Unknown error'}`);
    }
  }

  async getCurrencies(): Promise<NowPaymentsCurrency[]> {
    try {
      const data = await this.request<NowPaymentsCurrenciesResponse>('/currencies');
      return data.currencies || [];
    } catch (error) {
      console.error('Error fetching currencies:', error);
      // Retourner un tableau vide au lieu de throw pour éviter de casser l'UI
      return [];
    }
  }

  async getEnabledCurrencies(): Promise<NowPaymentsCurrency[]> {
    try {
      const currencies = await this.getCurrencies();
      return currencies.filter(currency => currency.enabled && !currency.is_fiat);
    } catch (error) {
      console.error('Error fetching enabled currencies:', error);
      return [];
    }
  }

  async getMinimumAmount(currencyFrom: string, currencyTo: string): Promise<NowPaymentsMinAmount | null> {
    try {
      const endpoint = `/min-amount?currency_from=${currencyFrom.toLowerCase()}&currency_to=${currencyTo.toLowerCase()}`;
      return await this.request<NowPaymentsMinAmount>(endpoint);
    } catch (error) {
      console.error('Error fetching minimum amount:', error);
      return null;
    }
  }

  async getEstimatedAmount(amount: number, currencyFrom: string, currencyTo: string): Promise<NowPaymentsEstimate | null> {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }
      
      const endpoint = `/estimate?amount=${amount}&currency_from=${currencyFrom.toLowerCase()}&currency_to=${currencyTo.toLowerCase()}`;
      return await this.request<NowPaymentsEstimate>(endpoint);
    } catch (error) {
      console.error('Error fetching estimated amount:', error);
      return null;
    }
  }

  async createPayment(paymentData: {
    price_amount: number;
    price_currency: string;
    pay_currency: string;
    ipn_callback_url?: string;
    order_id?: string;
    order_description?: string;
    customer_email?: string;
  }): Promise<NowPaymentsPayment | null> {
    try {
      // Valider les données requises
      if (!paymentData.price_amount || paymentData.price_amount <= 0) {
        throw new Error('Invalid price amount');
      }
      if (!paymentData.price_currency) {
        throw new Error('Price currency is required');
      }
      if (!paymentData.pay_currency) {
        throw new Error('Pay currency is required');
      }

      // Construire l'URL de callback seulement en production
      let ipnCallbackUrl = paymentData.ipn_callback_url;
      
      // En développement local, on n'utilise pas de callback URL car localhost n'est pas accessible depuis l'extérieur
      if (!ipnCallbackUrl && process.env.NODE_ENV === 'production') {
        ipnCallbackUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/nowpayments`;
      }

      const payload: any = {
        price_amount: Number(paymentData.price_amount),
        price_currency: paymentData.price_currency.toLowerCase(),
        pay_currency: paymentData.pay_currency.toLowerCase(),
        order_id: paymentData.order_id || `order_${Date.now()}`,
        order_description: paymentData.order_description || `Payment of ${paymentData.price_amount} ${paymentData.price_currency}`,
      };

      // Ajouter l'email client si fourni
      if (paymentData.customer_email) {
        payload.customer_email = paymentData.customer_email;
      }

      // Ajouter l'URL de callback seulement si elle est valide et en production
      if (ipnCallbackUrl && this.isValidUrl(ipnCallbackUrl) && process.env.NODE_ENV === 'production') {
        payload.ipn_callback_url = ipnCallbackUrl;
      }

      console.log('Creating NowPayments payment with payload:', payload);

      const result = await this.request<NowPaymentsPayment>('/payment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('NowPayments payment created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating NowPayments payment:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<NowPaymentsPaymentStatus | null> {
    try {
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }
      return await this.request<NowPaymentsPaymentStatus>(`/payment/${paymentId}`);
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return null;
    }
  }

  // Vérifier le statut du compte
  async getAccountStatus(): Promise<any> {
    try {
      return await this.request<any>('/account');
    } catch (error) {
      console.error('Error fetching account status:', error);
      throw error;
    }
  }

  // Valider une URL
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Tester la connexion à l'API
  async testConnection(): Promise<boolean> {
    try {
      await this.request<NowPaymentsStatusResponse>('/status');
      return true;
    } catch (error: any) {
      console.error('NowPayments API connection test failed:', error);
      
      // Fournir plus de détails sur l'échec de connexion
      if (error.message.includes('HTML')) {
        console.error('API is returning HTML instead of JSON. Possible issues:');
        console.error('- Invalid API key');
        console.error('- Service temporarily down');
        console.error('- Incorrect API endpoint');
        console.error('- IP restriction issues');
      }
      
      return false;
    }
  }

  // Méthode pour vérifier la validité de la clé API
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await this.request<any>('/account');
      return !!response;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
}

export const nowPaymentsService = new NowPaymentsService();