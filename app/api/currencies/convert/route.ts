import { NextRequest, NextResponse } from 'next/server';
import { convertFromUSD, convertToUSD, getCurrencyByCountryCode } from '@/app/lib/currency/conversion';

/**
 * GET /api/currencies/convert
 * Query params:
 *   from=XAF&amount=10000         → convert 10000 XAF to USD
 *   to=XAF&amount=50              → convert 50 USD to XAF
 *   countryCode=CM&usdAmount=50   → convert 50 USD to the currency of country CM
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const from = searchParams.get('from');        // source currency
    const to = searchParams.get('to');            // target currency
    const amount = parseFloat(searchParams.get('amount') || '0');
    const usdAmount = parseFloat(searchParams.get('usdAmount') || '0');
    const countryCode = searchParams.get('countryCode');

    // Mode 1: countryCode + usdAmount → USD to local currency
    if (countryCode && usdAmount > 0) {
      const currency = getCurrencyByCountryCode(countryCode);
      const result = await convertFromUSD(usdAmount, currency);
      return NextResponse.json({
        ...result,
        mode: 'usd_to_local',
        usdAmount,
        countryCode,
      });
    }

    // Mode 2: to + amount → USD to target currency
    if (to && amount > 0) {
      const result = await convertFromUSD(amount, to);
      return NextResponse.json({
        ...result,
        mode: 'usd_to_currency',
      });
    }

    // Mode 3: from + amount → foreign currency to USD
    if (from && amount > 0) {
      const result = await convertToUSD(amount, from);
      return NextResponse.json({
        ...result,
        mode: 'to_usd',
      });
    }

    return NextResponse.json(
      { error: 'Paramètres insuffisants. Utilisez: from+amount, to+amount, ou countryCode+usdAmount' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[/api/currencies/convert] Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur de conversion' }, { status: 500 });
  }
}
