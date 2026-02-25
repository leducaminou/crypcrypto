'use client';

import Image from "next/image";
import { useEffect, useState } from "react";

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

const Table = () => {
    const [tableData, setTableData] = useState<table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCryptoData = async () => {
            try {
                setLoading(true);
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
                setLoading(false);
            }
        };

        fetchCryptoData();

        // Optionnel: Rafraîchir les données toutes les 30 secondes
        const interval = setInterval(fetchCryptoData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <section>
                <div className='py-8 md:py-16 container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4' id="exchange-section">
                    <div className="rounded-2xl bg-tablebg p-8 overflow-x-auto relative z-10">
                        <h3 className="text-white/80 text-2xl">Diffusion en direct des tendances du marché</h3>
                        <div className="flex justify-center items-center h-40">
                            <p className="text-white">Chargement des données en cours...</p>
                        </div>
                    </div>
                </div>
                <Image src={'/images/table/Untitled.svg'} alt="ellipse" width={2460} height={102} />
            </section>
        );
    }

    if (error) {
        return (
            <section>
                <div className='py-8 md:py-16 container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4' id="exchange-section">
                    <div className="rounded-2xl bg-tablebg p-8 overflow-x-auto relative z-10">
                        <h3 className="text-white/80 text-2xl">Market Trend Live Stream</h3>
                        <div className="flex justify-center items-center h-40">
                            <p className="text-primary">Erreur: {error}</p>
                        </div>
                    </div>
                </div>
                <Image src={'/images/table/Untitled.svg'} alt="ellipse" width={2460} height={102} />
            </section>
        );
    }

    return (
        <section>
            <div className='py-8 md:py-16 container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4' id="exchange-section">
                <div className="rounded-2xl bg-tablebg p-8 overflow-x-auto relative z-10">
                    <h3 className="text-white/80 text-2xl">Market Trend Live Stream</h3>
                    <table className="table-auto w-full mt-10">
                        <thead>
                            <tr className="text-white bg-border rounded-2xl">
                                <th className="px-4 py-4 font-normal rounded-s-lg">#</th>
                                <th className="px-4 py-4 text-start font-normal">NAME</th>
                                <th className="px-4 py-4 font-normal">PRICE</th>
                                <th className="px-4 py-4 font-normal">CHANGE 24H</th>
                                <th className="px-4 py-4 font-normal">MARKET CAP</th>
                                <th className="px-4 py-4 font-normal rounded-e-lg">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((items, i) => (
                                <tr key={i} className="border-b border-b-border">
                                    <td className="px-4 py-6 text-center text-white">{items.index}</td>
                                    <td className="px-4 py-6 text-center text-white flex items-center justify-start gap-5 ">
                                        <Image 
                                            src={items.imgSrc} 
                                            alt={items.name} 
                                            height={50} 
                                            width={50} 
                                            onError={(e) => {
                                                // Fallback si l'image ne charge pas
                                                (e.target as HTMLImageElement).src = '/images/table/bitcoin.svg';
                                            }}
                                        />
                                        {items.name}
                                    </td>
                                    <td className="px-4 py-6 text-center text-white">${items.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className={`px-4 py-6 text-center ${items.change < 0 ? 'text-primary' : 'text-secondary'} `}>
                                        {items.change.toFixed(2)}%
                                    </td>
                                    <td className="px-4 py-6 text-center text-white">${items.cap.toLocaleString()}</td>
                                    <td className={`px-4 py-6 text-center ${items.action === 'Buy' ? 'text-secondary' : 'text-primary'}`}>
                                        {items.action}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Image src={'/images/table/Untitled.svg'} alt="ellipse" width={2460} height={102} />
        </section>
    )
}

export default Table;