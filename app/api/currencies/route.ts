import { NextResponse } from 'next/server';

const CRYPTO_FALLBACK = [
  { code: 'btc', name: 'Bitcoin' },
  { code: 'eth', name: 'Ethereum' },
  { code: 'usdt', name: 'Tether' },
  { code: 'bnb', name: 'BNB' },
  { code: 'sol', name: 'Solana' }
];

export async function GET() {
  try {
    // Mode développement avec fallback
    if (process.env.NODE_ENV === 'development' && !process.env.NOWPAYMENTS_API_KEY) {
      return NextResponse.json(CRYPTO_FALLBACK);
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) throw new Error('Configuration API manquante');

    const response = await fetch('https://api.nowpayments.io/v1/currencies', {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 3600 } // Cache 1h
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur API');
    }

    const data = await response.json();
    
    // Transformation universelle des données
    let currencies = [];
    
    if (Array.isArray(data)) {
      currencies = data;
    } 
    else if (data.currencies) {
      currencies = Object.entries(data.currencies).map(([code, name]) => ({ code, name }));
    }
    else if (data[0]?.currencies) {
      currencies = Object.entries(data[0].currencies).map(([code, name]) => ({ code, name }));
    }
    else {
      currencies = Object.entries(data).map(([code, name]) => ({ code, name }));
    }

    // Filtrage et formatage final
    const formatted = currencies
      .filter((c: any) => c.code && c.name)
      .map((c: any) => ({
        code: c.code.toLowerCase(),
        name: typeof c.name === 'string' ? c.name : c.code.toUpperCase()
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(formatted.length > 0 ? formatted : CRYPTO_FALLBACK);
    
  } catch (error) {
    console.error('API Currencies Error:', error);
    return NextResponse.json(CRYPTO_FALLBACK);
  }
}