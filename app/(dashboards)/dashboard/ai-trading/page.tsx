'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MoveDown, MoveUp } from 'lucide-react'

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  total_volume: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

const AITradingPage = () => {
  const [tableData, setTableData] = useState<CoinData[]>([]);
  const [loadingCrypto, setLoadingCrypto] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setLoadingCrypto(true);
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=true&price_change_percentage=1h,24h,7d'
        );
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }
        
        const data: CoinData[] = await response.json();
        setTableData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        console.error('Error fetching crypto data:', err);
      } finally {
        setLoadingCrypto(false);
      }
    };

    fetchCryptoData();

    // Rafraîchir les données toutes les 30 secondes
    const interval = setInterval(fetchCryptoData, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderSparkline = (prices: number[] | undefined) => {
    if (!prices || prices.length === 0) {
      return <div className="h-10 w-20 flex items-center justify-center text-gray-400">N/A</div>;
    }

    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const isPositive = prices[prices.length - 1] > prices[0];
    
    return (
      <svg width="80" height="40" className="overflow-visible">
        <polyline
          fill="none"
          stroke={isPositive ? "#10B981" : "#EF4444"}
          strokeWidth="2"
          points={prices.map((price, index) => 
            `${(index / (prices.length - 1)) * 80},${40 - ((price - minPrice) / (maxPrice - minPrice)) * 35}`
          ).join(' ')}
        />
      </svg>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    }
    if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    }
    if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const renderChange = (change: number | undefined) => {
    if (change === undefined || change === null) return <span className="text-gray-400">N/A</span>;
    
    const isPositive = change >= 0;
    const Icon = isPositive ? MoveUp : MoveDown;
    
    return (
      <div className={`flex items-center gap-1 justify-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        <Icon width={15} height={15} />
        <span>{Math.abs(change).toFixed(2)}%</span>
      </div>
    );
  };

  if (loadingCrypto) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Chargement des données cryptos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-red-500 text-xl">Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Trading automatique par IA</h1>
        
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr className="text-white">
                  <th className="px-4 py-4 font-normal text-center rounded-s-lg">#</th>
                  <th className="px-4 py-4 text-start font-normal min-w-[200px]">Nom</th>
                  <th className="px-4 py-4 font-normal text-center min-w-[120px]">Prix Actuel</th>
                  <th className="px-4 py-4 font-normal text-center min-w-[120px]">1H</th>
                  <th className="px-4 py-4 font-normal text-center min-w-[120px]">24H</th>
                  <th className="px-4 py-4 font-normal text-center min-w-[120px]">7J</th>
                  <th className="px-4 py-4 font-normal text-center min-w-[140px]">Volume 24H</th>
                  <th className="px-4 py-4 font-normal text-center min-w-[100px]">Graph 7J</th>
                  <th className="px-4 py-4 font-normal text-center rounded-e-lg min-w-[120px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {tableData.map((coin, index) => (
                  <tr key={coin.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-6 text-center text-white font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-6 text-white">
                      <div className="flex items-center gap-3">
                        <Image 
                          src={coin.image} 
                          alt={coin.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/table/bitcoin.svg';
                          }}
                        />
                        <div className="text-left">
                          <div className="font-semibold">{coin.name}</div>
                          <div className="text-gray-400 text-sm">{coin.symbol.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-center text-white font-semibold">
                      ${coin.current_price.toLocaleString(undefined, { 
                        minimumFractionDigits: coin.current_price < 1 ? 4 : 2, 
                        maximumFractionDigits: coin.current_price < 1 ? 4 : 2 
                      })}
                    </td>
                    <td className="px-4 py-6 text-center">
                      {renderChange(coin.price_change_percentage_1h_in_currency)}
                    </td>
                    <td className="px-4 py-6 text-center">
                      {renderChange(coin.price_change_percentage_24h)}
                    </td>
                    <td className="px-4 py-6 text-center">
                      {renderChange(coin.price_change_percentage_7d_in_currency)}
                    </td>
                    <td className="px-4 py-6 text-center text-white font-medium">
                      {formatNumber(coin.total_volume)}
                    </td>
                    <td className="px-4 py-6 text-center">
                      {renderSparkline(coin.sparkline_in_7d?.price)}
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className={`font-semibold ${
                        coin.price_change_percentage_24h >= 0 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {coin.price_change_percentage_24h >= 0 ? 'Achat auto' : 'Vente auto'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-gray-400 text-sm">
          <p>Données mises à jour en temps réel via CoinGecko API</p>
        </div>
      </div>
    </div>
  );
};

export default AITradingPage;