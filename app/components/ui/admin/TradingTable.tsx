'use client'
import { useState, useEffect, useMemo } from 'react'

import Image from 'next/image'
import { MoveDown, MoveUp } from 'lucide-react'



interface table {
    index: number;
    name: string;
    price: number;
    change: number;
    cap: number;
    action: string;
    imgSrc: string;
}

interface CoinData {
    id: string;
    name: string;
    symbol: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap: number;
    image: string;
}


const TradingTable = () => {


  const [tableData, setTableData] = useState<table[]>([]);
  const [loadingCrypto, setLoadingCrypto] = useState(true);
    const [error, setError] = useState<string | null>(null);



      useEffect(() => {
          const fetchCryptoData = async () => {
              try {
                  setLoadingCrypto(true);
                  const response = await fetch(
                      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=4&page=1&sparkline=false'
                  );
                  
                  if (!response.ok) {
                      throw new Error('Erreur lors de la récupération des données');
                  }
                  
                  const data: CoinData[] = await response.json();
                  
                  const formattedData: table[] = data.map((coin, index) => ({
                      index: index + 1,
                      name: `${coin.name} (${coin.symbol.toUpperCase()})`,
                      price: coin.current_price,
                      change: coin.price_change_percentage_24h,
                      cap: coin.market_cap,
                      action: coin.price_change_percentage_24h >= 0 ? "Buy" : "Sell",
                      imgSrc: coin.image,
                  }));
                  
                  setTableData(formattedData);
                  setError(null);
              } catch (err) {
                  setError(err instanceof Error ? err.message : 'Une erreur est survenue');
                  console.error('Error fetching crypto data:', err);
              } finally {
                  setLoadingCrypto(false);
              }
          };
  
          fetchCryptoData();
  
          // Optionnel: Rafraîchir les données toutes les 30 secondes
          const interval = setInterval(fetchCryptoData, 30000);
          return () => clearInterval(interval);
      }, []);
  

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center">
               <table className="table-auto w-full">
                                   <thead>
                                       <tr className="text-white rounded-2xl">
                                           <th className="px-4 py-4 font-normal rounded-s-lg">#</th>
                                           <th className="px-4 py-4 text-start font-normal">Nom</th>
                                           <th className="px-4 py-4 font-normal">Prix</th>
                                           <th className="px-4 py-4 font-normal">Variation</th>
                                           <th className="px-4 py-4 font-normal">Capitalisation (24H)</th>
                                           <th className="px-4 py-4 font-normal rounded-e-lg">Action</th>
                                       </tr>
                                   </thead>
                                   <tbody>
                                       {tableData.map((items, i) => (
                                           <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                               <td className="px-4 py-6 text-center text-white">{items.index}</td>
                                               <td className="px-4 py-6 text-center text-white flex items-center justify-start gap-5 ">
                                                   <Image 
                                                       src={items.imgSrc} 
                                                       alt={items.name} 
                                                       height={20} 
                                                       width={20} 
                                                       onError={(e) => {
                                                           // Fallback si l'image ne charge pas
                                                           (e.target as HTMLImageElement).src = '/images/table/bitcoin.svg';
                                                       }}
                                                   />
                                                   {items.name}
                                               </td>
                                               <td className="px-4 py-6 text-center text-white">${items.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                               <td className={`px-4 py-6 text-center ${items.change < 0 ? 'text-red-500' : 'text-green-500'} `}>
                                                   {items.change < 0

                                                   ? <div className='flex items-center gap-0'>
                                                    <MoveDown width={15} height={15} className='text-red-500' /> 
                                                    {items.change.toFixed(2)}%
                                                    </div>
                                                   : <div className='flex items-center gap-0'>
                                                    <MoveUp width={15} height={15} className='text-green-500'  /> 
                                                    {items.change.toFixed(2)}%
                                                    </div>
                                                   }  
                                               </td>
                                               <td className="px-4 py-6 text-center text-white">${items.cap.toLocaleString()}</td>
                                               <td className={`px-4 py-6 text-center font-semibold ${items.action === 'Buy' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                   {items.action  === 'Buy' ? 'Achat auto' : 'Vente auto'}
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>

          </div>
  )
}

export default TradingTable