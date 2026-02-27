/**
 * FiguraNex — Currency Conversion Service
 * Converts any currency to USD using open.er-api.com (free, no rate limit)
 * Cache TTL: 1 hour
 */

interface CacheEntry {
  rates: Record<string, number>;
  fetchedAt: number;
}

// In-memory cache keyed by base currency (we always fetch USD base)
const rateCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Fallback rates (in case API is unreachable) — approximate as of 2025
const FALLBACK_RATES_TO_USD: Record<string, number> = {
  XAF: 1 / 610,    // 1 USD ≈ 610 XAF
  XOF: 1 / 610,    // Same as XAF (CFA franc)
  EUR: 1.08,
  GBP: 1.27,
  NGN: 1 / 1600,
  GHS: 1 / 14.5,
  KES: 1 / 129,
  TZS: 1 / 2550,
  UGX: 1 / 3700,
  MAD: 1 / 10,
  EGP: 1 / 47,
  ZAR: 1 / 18.5,
  CAD: 0.73,
  AUD: 0.65,
  USD: 1,
};

/**
 * Fetches all exchange rates relative to USD from open.er-api.com
 * Results are cached for 1 hour.
 */
async function fetchRates(): Promise<Record<string, number>> {
  const cached = rateCache.get('USD');
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);

    const data = await res.json();
    if (!data.rates) throw new Error('Invalid exchange rate response');

    const rates: Record<string, number> = data.rates;
    rateCache.set('USD', { rates, fetchedAt: Date.now() });
    return rates;
  } catch (err) {
    console.error('[Currency] Failed to fetch rates, using fallbacks:', err);
    // Build fallback: how many units of currency = 1 USD → invert to get USD per unit
    const fallback: Record<string, number> = {};
    for (const [code, usdPer1] of Object.entries(FALLBACK_RATES_TO_USD)) {
      // open.er-api rates are: how many of currency = 1 USD
      fallback[code] = 1 / usdPer1;
    }
    return fallback;
  }
}

/**
 * Returns how many USD you get for 1 unit of fromCurrency.
 * e.g. getUSDRate('XAF') ≈ 0.001639
 */
export async function getUSDRate(fromCurrency: string): Promise<number> {
  const upper = fromCurrency.toUpperCase();
  if (upper === 'USD') return 1;

  const rates = await fetchRates();

  // rates[XAF] = how many XAF = 1 USD → to get USD per 1 XAF: 1 / rates[XAF]
  const ratePerUSD = rates[upper];
  if (!ratePerUSD) {
    console.warn(`[Currency] No rate found for ${upper}, returning 0`);
    return 0;
  }
  return 1 / ratePerUSD;
}

export interface ConversionResult {
  usd: number;
  rate: number;        // how many USD per 1 unit of fromCurrency
  from: string;
  originalAmount: number;
  rateDisplay: string; // e.g. "1 USD ≈ 610 XAF"
}

/**
 * Converts an amount from any currency to USD.
 * e.g. convertToUSD(10000, 'XAF') → { usd: 16.39, rate: 0.001639, ... }
 */
export async function convertToUSD(
  amount: number,
  fromCurrency: string
): Promise<ConversionResult> {
  const upper = fromCurrency.toUpperCase();

  if (upper === 'USD') {
    return {
      usd: amount,
      rate: 1,
      from: 'USD',
      originalAmount: amount,
      rateDisplay: '1 USD = 1 USD',
    };
  }

  const rate = await getUSDRate(upper);
  const usd = Math.round(amount * rate * 100) / 100;
  const inverse = rate > 0 ? Math.round(1 / rate) : 0;

  return {
    usd,
    rate,
    from: upper,
    originalAmount: amount,
    rateDisplay: `1 USD ≈ ${inverse} ${upper}`,
  };
}

/**
 * Converts USD to a local currency amount.
 * e.g. convertFromUSD(50, 'XAF') → { local: 30500, rate: 610, currency: 'XAF' }
 */
export interface USDToLocalResult {
  local: number;
  rate: number;         // how many local units = 1 USD
  currency: string;
  rateDisplay: string;  // e.g. "1 USD ≈ 610 XAF"
}

export async function convertFromUSD(
  usdAmount: number,
  toCurrency: string
): Promise<USDToLocalResult> {
  const upper = toCurrency.toUpperCase();

  if (upper === 'USD') {
    return {
      local: usdAmount,
      rate: 1,
      currency: 'USD',
      rateDisplay: '1 USD = 1 USD',
    };
  }

  const rates = await fetchRates();
  const ratePerUSD = rates[upper] ?? (FALLBACK_RATES_TO_USD[upper] ? 1 / FALLBACK_RATES_TO_USD[upper] : 0);

  if (!ratePerUSD) {
    return { local: 0, rate: 0, currency: upper, rateDisplay: `Taux non disponible pour ${upper}` };
  }

  const local = Math.round(usdAmount * ratePerUSD);

  return {
    local,
    rate: ratePerUSD,
    currency: upper,
    rateDisplay: `1 USD ≈ ${Math.round(ratePerUSD)} ${upper}`,
  };
}

/**
 * Maps a country's dial_code or country_code to its ISO 4217 currency code.
 * Used to show the right currency for each user's country.
 */
export function getCurrencyByCountryCode(countryCode: string): string {
  const map: Record<string, string> = {
    CM: 'XAF',   // Cameroun
    TD: 'XAF',   // Tchad
    CF: 'XAF',   // RCA
    CG: 'XAF',   // République du Congo
    GA: 'XAF',   // Gabon
    BJ: 'XOF',   // Bénin
    CI: 'XOF',   // Côte d'Ivoire
    ML: 'XOF',   // Mali
    TG: 'XOF',   // Togo
    SN: 'XOF',   // Sénégal
    NG: 'NGN',   // Nigeria
    GH: 'GHS',   // Ghana
    KE: 'KES',   // Kenya
    TZ: 'TZS',   // Tanzania
    UG: 'UGX',   // Uganda
    MA: 'MAD',   // Maroc
    EG: 'EGP',   // Egypt
    ZA: 'ZAR',   // Afrique du Sud
    FR: 'EUR',
    GB: 'GBP',
    CA: 'CAD',
    AU: 'AUD',
    US: 'USD',
  };
  return map[countryCode?.toUpperCase()] ?? 'USD';
}
