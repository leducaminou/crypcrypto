// components/CryptoCheckout.tsx
"use client";

import { nowPaymentsService } from "@/app/services/nowpayments";
import { useState } from "react";
import { toast } from "react-toastify";

export default function CryptoCheckout() {
  const [amount, setAmount] = useState<number>(100); // Montant par défaut (100 USD)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const paymentData = {
        price_amount: amount,
        price_currency: "usd",
        pay_currency: "btc", // Optionnel (sinon l'utilisateur choisit)
      };

      const response = await nowPaymentsService.createPayment(paymentData);
      if (response && response.pay_address) {
        setPaymentUrl(response.pay_address);
      }
      toast.success("Paiement créé avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la création du paiement.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Paiement en Crypto</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Montant (USD)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? "Chargement..." : "Payer avec Crypto"}
      </button>

      {paymentUrl && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="font-semibold">Adresse de paiement :</p>
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline break-all"
          >
            {paymentUrl}
          </a>
        </div>
      )}
    </div>
  );
}