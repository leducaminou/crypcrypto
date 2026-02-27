import { Gender } from "@prisma/client";

export const ITEMS_PER_PAGE = 10;

export const periodFilterOptions = [
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'ACTIVE', label: 'Actifs' },
                  { value: 'COMPLETED', label: 'Terminés' }
                ]

export const PaymentMethodLitArray = ['BANK', 'BITCOIN', 'ETHEREUM', 'MOBILE', 'USDT', 'OTHER']
            

export const cryptosList = [
  { code: 'ada', name: 'Cardano' },
  { code: 'bnb', name: 'BNB' },
  { code: 'btc', name: 'Bitcoin' },
  { code: 'eth', name: 'Ethereum' },
  { code: 'sol', name: 'Solana' },
  { code: 'usdt', name: 'Tether' },
  { code: 'xrp', name: 'XRP' },
];

export const genderList = [
  { id: Gender.Homme, name: Gender.Homme },
  { id: Gender.Femme, name: Gender.Femme },
];

export const authorizedMobilePayment = ['+237', '00237', '237']
export const CAMEROON_DIAL_CODE = '+237'
export const CONTACT_EMAIL = 'contact@monaia.com'

export const OrangeNumber = '695233759'
export const OrangeName = 'FiguraNex Orange'
export const MtnNumber = '654720874'
export const MtnName = 'FiguraNex MTN'