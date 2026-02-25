import { WithdrawalStatus } from '@/types';
import { getStatusColor } from '../lib/utils';
import LinkWithModal from './modal/LinkWithModal';

interface WithdrawalCardProps {
  id: string;
  amount: string;
  method: string;
  type?: 'withdrawal' | 'wallet';
  date: string;
  status: WithdrawalStatus;
  walletAddress?: string;
  rejection_reason?: string;
  provider?: string;
}

export default function WithdrawalCard({
  id,
  amount,
  method,
  date,
  type = 'withdrawal',
  status,
  walletAddress,
  rejection_reason,
  provider,
}: WithdrawalCardProps) {

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500 transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">{type === 'wallet' ? 'Paiement' : 'Retrait'} #{id}</h3>
          <p className="text-gray-400 text-sm">{date}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
          {status.toLowerCase() === 'pending' && 'En attente'}
          {status.toLowerCase() === 'completed' && 'Complété'}
          {status.toLowerCase() === 'failed' && 'Échoué'}
          {status.toLowerCase() === 'processing' && 'En traitement'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-400 text-sm">Montant</p>
          <p className="font-medium">{amount}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Méthode</p>
          <p className="font-medium">{method === 'MOBILE' ? 'Retrait Mobile' : 'Retrait Crypto'}</p>
        </div>
      </div>

      {walletAddress && (
        <div className="mb-4">
          <p className="text-gray-400 text-sm">Adresse du portefeuille</p>
          <p className="font-mono text-sm text-gray-300 truncate">{provider} - {walletAddress}</p>
        </div>
      )}

      {status.toLowerCase() === 'FAILED' && (
        <div className="mt-4 p-3 bg-red-900 bg-opacity-30 rounded-lg text-sm flex items-center gap-2">
          Votre retrait a été rejeté.  
          {
            rejection_reason && rejection_reason !== "" &&
          <LinkWithModal 
          title="Voir les raisons du rejet"
          content={
            
              <div className='flex flex-col gap-4'> 
              <h2 className='text-lg font-semibold'>Raison du rejet</h2>
              <p>{rejection_reason}</p>
            </div>
          }
          />
          }
        </div>
      )}
    </div>
  );
}