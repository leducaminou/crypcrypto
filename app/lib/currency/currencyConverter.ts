import axios from 'axios';

// Types pour la réponse de l'API ExchangeRate-API
interface ExchangeRateResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

// Enum pour les devises locales
export enum CurrencyType {
  XAF = 'XAF',
  XOF = 'XOF',
  NGN = 'NGN',
}

// Cache pour stocker les taux de change (valide pendant 1 heure)
const rateCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

// Clé API ExchangeRate-API (à configurer dans .env)
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY || '2ea1434571-1557de81b5-t0y3nk';
const EXCHANGE_RATE_API_URL = 'https://v6.exchangerate-api.com/v6';

// Taux de change par défaut en cas d'échec de l'API (basés sur des valeurs approximatives au 13 août 2025)
export const DEFAULT_RATES: Record<CurrencyType, number> = {
  [CurrencyType.XAF]: 0.001667, // 1 XAF ≈ 0.001667 USD
  [CurrencyType.XOF]: 0.001667, // 1 XOF ≈ 0.001667 USD (même parité que XAF)
  [CurrencyType.NGN]: 0.000625, // 1 NGN ≈ 0.000625 USD
};

export const convertToUSD = async (
  amount: number,
  fromCurrency: CurrencyType,
  toCurrency: 'USD' = 'USD'
): Promise<number> => {
  if (!Object.values(CurrencyType).includes(fromCurrency)) {
    throw new Error(`Invalid currency: ${fromCurrency}`);
  }

  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  // Vérifier le cache
  const cacheKey = `${fromCurrency}_USD`;
  const cached = rateCache[cacheKey];
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return Number((amount * cached.rate).toFixed(2));
  }

  try {
    const response = await axios.get<ExchangeRateResponse>(
      `${EXCHANGE_RATE_API_URL}/${EXCHANGE_RATE_API_KEY}/latest/${fromCurrency}`,
      { timeout: 5000 }
    );

    if (response.data.result !== 'success') {
      throw new Error('Failed to fetch exchange rates');
    }

    const rate = response.data.conversion_rates[toCurrency];
    if (!rate) {
      throw new Error(`No rate available for ${toCurrency}`);
    }

    // Mettre à jour le cache
    rateCache[cacheKey] = { rate, timestamp: now };

    return Number((amount * rate).toFixed(2));
  } catch (error: any) {
    console.error(`Failed to convert ${fromCurrency} to USD:`, {
      message: error.message,
      response: error.response?.data,
    });

    // Utiliser le taux par défaut
    const defaultRate = DEFAULT_RATES[fromCurrency];
    return Number((amount * defaultRate).toFixed(2));
  }
};