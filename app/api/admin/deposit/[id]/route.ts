import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/lib/auth.config'
import { TransactionStatus, WalletType, TransactionType, ReferralStatus } from '@prisma/client'
import { generateTransactionReference } from '@/app/lib/utils'
import { convertFromUSD, getCurrencyByCountryCode } from '@/app/lib/currency/conversion'

interface UpdateDepositRequest {
  action: 'approve' | 'reject'
}

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const transactionId = resolvedParams.id

    // Vérifier l'authentification de l'admin
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body: UpdateDepositRequest = await request.json()
    const { action } = body

    // Convertir les IDs en BigInt
    const transactionIdBigInt = BigInt(transactionId)
    const adminIdBigInt = BigInt(session.user.id)

    // Récupérer la transaction avec toutes les données nécessaires
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transactionIdBigInt,
        type: 'DEPOSIT'
      },
      include: {
        user: {
          include: {
            country: true,
            referralsAsReferee: {
              include: {
                referrer: true
              }
            }
          }
        },
        wallet: true,
        paymentAccount: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Dépôt non trouvé' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Le dépôt a déjà été traité' },
        { status: 400 }
      )
    }

    const amount = Number(transaction.amount)

    // Récupérer les paramètres système
    const systemSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['registration_bonus_percentage', 'referral_bonus_percentage', 'first_deposit_bonus_percentage']
        }
      }
    })

    // Convertir les paramètres en nombres
    const registrationBonusPercentage = parseFloat(
      systemSettings.find(s => s.key === 'registration_bonus_percentage')?.value || '0'
    )
    const referralBonusPercentage = parseFloat(
      systemSettings.find(s => s.key === 'referral_bonus_percentage')?.value || '0'
    )
    const firstDepositBonusPercentage = parseFloat(
      systemSettings.find(s => s.key === 'first_deposit_bonus_percentage')?.value || '0'
    )

    // Calculer les métadonnées de conversion si approbation mobile
    let originalCurrency = transaction.original_currency;
    let originalAmount = transaction.original_amount ? Number(transaction.original_amount) : null;
    let exchangeRate = transaction.exchange_rate ? Number(transaction.exchange_rate) : null;

    if (action === 'approve' && transaction.paymentAccount?.type === 'MOBILE' && !originalCurrency) {
      const countryCode = transaction.user.country?.country_code || 'CM';
      const currency = getCurrencyByCountryCode(countryCode);
      const conv = await convertFromUSD(amount, currency);
      
      originalCurrency = conv.currency;
      originalAmount = conv.local;
      exchangeRate = conv.rate;
    }

    // Commencer une transaction pour garantir l'intégrité des données
    const result = await prisma.$transaction(async (tx) => {
      const newStatus = action === 'approve' ? 'COMPLETED' : 'FAILED'

      // 1. Mettre à jour le statut de la transaction
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionIdBigInt },
        data: { 
          status: newStatus,
          processed_at: new Date(),
          ...(action === 'approve' ? {
            original_currency: originalCurrency,
            original_amount: originalAmount,
            exchange_rate: exchangeRate
          } : {})
        }
      })

      // 2. Si approbation, créditer le wallet DEPOSIT de l'utilisateur et gérer les bonus
      if (action === 'approve') {
        // Trouver ou créer le wallet DEPOSIT de l'utilisateur
        let depositWallet = await tx.wallet.findFirst({
          where: {
            user_id: transaction.user_id,
            type: 'DEPOSIT'
          }
        })

        if (!depositWallet) {
          // Créer le wallet DEPOSIT s'il n'existe pas
          depositWallet = await tx.wallet.create({
            data: {
              user_id: transaction.user_id,
              type: 'DEPOSIT',
              balance: 0,
              locked_balance: 0
            }
          })
        }

        // Créditer le wallet
        await tx.wallet.update({
          where: { id: depositWallet.id },
          data: {
            balance: {
              increment: amount
            }
          }
        })

        // 3. Gérer tous les bonus
        await handleAllBonuses(
          tx, 
          transaction, 
          amount, 
          registrationBonusPercentage,
          referralBonusPercentage,
          firstDepositBonusPercentage
        )
      }

      // Créer une notification pour l'utilisateur
      await tx.notification.create({
        data: {
          user_id: transaction.user_id,
          title: action === 'approve' ? 'Dépôt approuvé' : 'Dépôt rejeté',
          message: action === 'approve' 
            ? `Votre dépôt de ${amount}$ a été approuvé et crédité sur votre compte.` 
            : `Votre dépôt de ${amount}$ a été rejeté par l'administrateur.`,
          type: 'TRANSACTION',
          metadata: {
            transactionId: transactionId,
            amount: amount,
            action: action
          }
        }
      })

      // Créer une activité admin pour l'audit
      await tx.adminActivity.create({
        data: {
          user_id: adminIdBigInt,
          action: `DEPOSIT_${action.toUpperCase()}`,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            transactionId: transactionId,
            userId: transaction.user_id.toString(),
            amount: amount,
            action: action
          }
        }
      })

      return { 
        transaction: {
          id: updatedTransaction.id.toString(),
          status: newStatus
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Dépôt ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
      data: result
    })

  } catch (error) {
    console.error('Error updating deposit:', error)
    
    if (error instanceof Error) {
      // Vérifier si c'est une erreur Prisma
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { 
            error: 'Erreur de contrainte unique',
            details: 'Une transaction avec cette référence existe déjà'
          },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { 
            error: 'Enregistrement non trouvé',
            details: 'Impossible de trouver l\'enregistrement à mettre à jour'
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          error: error.message,
          details: 'Une erreur est survenue lors du traitement du dépôt'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'Une erreur interne est survenue'
      },
      { status: 500 }
    )
  }
}

// Fonction pour gérer tous les bonus
async function handleAllBonuses(
  tx: any,
  transaction: any,
  depositAmount: number,
  registrationBonusPercentage: number,
  referralBonusPercentage: number,
  firstDepositBonusPercentage: number
) {
  try {
    // Récupérer l'utilisateur avec ses informations complètes
    const user = await tx.user.findUnique({
      where: { id: transaction.user_id },
      include: {
        referralsAsReferee: {
          include: {
            referrer: true
          }
        }
      }
    })

    if (!user) {
      console.error('Utilisateur non trouvé pour le bonus')
      return
    }

    // 1. Gestion du parrainage et bonus de référence
    await handleReferralAndRegistrationBonus(
      tx, 
      user, 
      depositAmount, 
      registrationBonusPercentage, 
      referralBonusPercentage
    )

    // 2. Gestion du bonus premier dépôt
    await handleFirstDepositBonus(
      tx,
      user,
      depositAmount,
      firstDepositBonusPercentage
    )

    // 3. Mettre à jour is_new_user à false
    if (user.is_new_user) {
      await tx.user.update({
        where: { id: user.id },
        data: { is_new_user: false }
      })
    }

  } catch (error) {
    console.error('Error handling all bonuses:', error)
    // Ne pas propager l'erreur pour ne pas bloquer le dépôt principal
  }
}

// Fonction pour gérer le parrainage et le bonus d'inscription
async function handleReferralAndRegistrationBonus(
  tx: any,
  user: any,
  depositAmount: number,
  registrationBonusPercentage: number,
  referralBonusPercentage: number
) {
  try {
    let referrer: any = null
    let referral: any = null

    // Chercher d'abord dans la table Referral
    if (user.referralsAsReferee && user.referralsAsReferee.length > 0) {
      referral = user.referralsAsReferee[0]
      referrer = referral.referrer
    } 
    // Sinon chercher via le champ referred_by
    else if (user.referred_by) {
      referrer = await tx.user.findUnique({
        where: { id: user.referred_by }
      })

      if (referrer) {
        // Créer un nouvel enregistrement Referral
        referral = await tx.referral.create({
          data: {
            referred_by: referrer.id,
            user_id: user.id,
            earnings: 0,
            status: 'PENDING',
            signed_up_at: new Date()
          }
        })
      }
    }

    // Si un parrain existe, traiter les bonus
    if (referrer && referral) {
      // 1. Bonus de parrainage (10% du dépôt)
      if (referralBonusPercentage > 0) {
        const referralBonusAmount = depositAmount * (referralBonusPercentage / 100)
        await processReferralBonus(tx, referral, referrer, user, depositAmount, referralBonusAmount, referralBonusPercentage)
      }

      // 2. Bonus d'inscription pour le parrain (si user est nouveau)
      if (user.is_new_user && registrationBonusPercentage > 0) {
        const registrationBonusAmount = depositAmount * (registrationBonusPercentage / 100)
        await processRegistrationBonus(tx, referral, referrer, user, depositAmount, registrationBonusAmount, registrationBonusPercentage)
      }
    }
  } catch (error) {
    console.error('Error handling referral and registration bonus:', error)
    throw error
  }
}

// Fonction pour traiter le bonus de parrainage
async function processReferralBonus(
  tx: any,
  referral: any,
  referrer: any,
  user: any,
  depositAmount: number,
  bonusAmount: number,
  bonusPercentage: number
) {
  // Trouver ou créer le wallet BONUS du parrain
  let bonusWallet = await tx.wallet.findFirst({
    where: {
      user_id: referrer.id,
      type: 'BONUS'
    }
  })

  if (!bonusWallet) {
    bonusWallet = await tx.wallet.create({
      data: {
        user_id: referrer.id,
        type: 'BONUS',
        balance: 0,
        locked_balance: 0
      }
    })
  }

  // Créditer le wallet BONUS du parrain
  await tx.wallet.update({
    where: { id: bonusWallet.id },
    data: {
      balance: {
        increment: bonusAmount
      }
    }
  })

  // Créer une transaction pour le bonus de parrainage
  const referralTransaction = await tx.transaction.create({
    data: {
      reference: generateTransactionReference('REFERRAL'),
      user_id: referrer.id,
      wallet_id: bonusWallet.id,
      type: 'DIVIDEND',
      status: 'COMPLETED',
      amount: bonusAmount,
      fee: 0,
      details: `Bonus de parrainage - ${bonusPercentage}% du dépôt de ${user.email}`,
      metadata: {
        referralId: referral.id.toString(),
        refereeId: user.id.toString(),
        originalDepositAmount: depositAmount,
        bonusPercentage: bonusPercentage,
        bonusType: 'REFERRAL'
      },
      processed_at: new Date()
    }
  })

  // Créer un enregistrement ReferralBonus
  await tx.referralBonus.create({
    data: {
      referral_id: referral.id,
      transaction_id: referralTransaction.id,
      amount: bonusAmount,
      description: `Bonus de parrainage de ${bonusPercentage}% sur le dépôt de ${depositAmount}$`
    }
  })

  // Mettre à jour le referral
  await tx.referral.update({
    where: { id: referral.id },
    data: {
      earnings: {
        increment: bonusAmount
      },
      status: 'ACTIVE',
      first_deposit_at: new Date(),
      last_earning_at: new Date()
    }
  })

  // Créer une notification pour le parrain
  await tx.notification.create({
    data: {
      user_id: referrer.id,
      title: 'Bonus de parrainage reçu',
      message: `Vous avez reçu un bonus de parrainage de ${bonusAmount}$ (${bonusPercentage}%) pour le dépôt de votre filleul ${user.email}.`,
      type: 'TRANSACTION',
      metadata: {
        transactionId: referralTransaction.id.toString(),
        referralId: referral.id.toString(),
        bonusAmount: bonusAmount,
        bonusPercentage: bonusPercentage
      }
    }
  })
}

// Fonction pour traiter le bonus d'inscription
async function processRegistrationBonus(
  tx: any,
  referral: any,
  referrer: any,
  user: any,
  depositAmount: number,
  bonusAmount: number,
  bonusPercentage: number
) {
  // Trouver ou créer le wallet BONUS du parrain
  let bonusWallet = await tx.wallet.findFirst({
    where: {
      user_id: referrer.id,
      type: 'BONUS'
    }
  })

  if (!bonusWallet) {
    bonusWallet = await tx.wallet.create({
      data: {
        user_id: referrer.id,
        type: 'BONUS',
        balance: 0,
        locked_balance: 0
      }
    })
  }

  // Créditer le wallet BONUS du parrain
  await tx.wallet.update({
    where: { id: bonusWallet.id },
    data: {
      balance: {
        increment: bonusAmount
      }
    }
  })

  // Créer une transaction pour le bonus d'inscription
  const registrationTransaction = await tx.transaction.create({
    data: {
      reference: generateTransactionReference('DIVIDEND'),
      user_id: referrer.id,
      wallet_id: bonusWallet.id,
      type: 'BONUS',
      status: 'COMPLETED',
      amount: bonusAmount,
      fee: 0,
      details: `Bonus d'inscription - ${bonusPercentage}% du dépôt d'inscription de ${user.email}`,
      metadata: {
        referralId: referral.id.toString(),
        refereeId: user.id.toString(),
        originalDepositAmount: depositAmount,
        bonusPercentage: bonusPercentage,
        bonusType: 'REGISTRATION'
      },
      processed_at: new Date()
    }
  })

  // Créer une notification pour le parrain
  await tx.notification.create({
    data: {
      user_id: referrer.id,
      title: 'Bonus d\'inscription reçu',
      message: `Vous avez reçu un bonus d'inscription de ${bonusAmount}$ (${bonusPercentage}%) pour l'inscription de votre filleul ${user.email}.`,
      type: 'TRANSACTION',
      metadata: {
        transactionId: registrationTransaction.id.toString(),
        referralId: referral.id.toString(),
        bonusAmount: bonusAmount,
        bonusPercentage: bonusPercentage
      }
    }
  })
}

// Fonction pour gérer le bonus du premier dépôt
async function handleFirstDepositBonus(
  tx: any,
  user: any,
  depositAmount: number,
  firstDepositBonusPercentage: number
) {
  try {
    // Vérifier si c'est le premier dépôt dans le wallet DEPOSIT
    const previousDeposits = await tx.transaction.count({
      where: {
        user_id: user.id,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        wallet: {
          type: 'DEPOSIT'
        }
      }
    })

    // Si c'est le premier dépôt complet
    if (previousDeposits === 0 && firstDepositBonusPercentage > 0) {
      const firstDepositBonusAmount = depositAmount * (firstDepositBonusPercentage / 100)

      // Trouver ou créer le wallet BONUS de l'utilisateur
      let userBonusWallet = await tx.wallet.findFirst({
        where: {
          user_id: user.id,
          type: 'BONUS'
        }
      })

      if (!userBonusWallet) {
        userBonusWallet = await tx.wallet.create({
          data: {
            user_id: user.id,
            type: 'BONUS',
            balance: 0,
            locked_balance: 0
          }
        })
      }

      // Créditer le wallet BONUS de l'utilisateur
      await tx.wallet.update({
        where: { id: userBonusWallet.id },
        data: {
          balance: {
            increment: firstDepositBonusAmount
          }
        }
      })

      // Créer une transaction pour le bonus premier dépôt
      const firstDepositTransaction = await tx.transaction.create({
        data: {
          reference: generateTransactionReference('DIVIDEND'),
          user_id: user.id,
          wallet_id: userBonusWallet.id,
          type: 'BONUS',
          status: 'COMPLETED',
          amount: firstDepositBonusAmount,
          fee: 0,
          details: `Bonus premier dépôt - ${firstDepositBonusPercentage}% de votre premier dépôt`,
          metadata: {
            originalDepositAmount: depositAmount,
            bonusPercentage: firstDepositBonusPercentage,
            bonusType: 'FIRST_DEPOSIT'
          },
          processed_at: new Date()
        }
      })

      // Créer une notification pour l'utilisateur
      await tx.notification.create({
        data: {
          user_id: user.id,
          title: 'Bonus premier dépôt reçu',
          message: `Félicitations ! Vous avez reçu un bonus de ${firstDepositBonusAmount}$ (${firstDepositBonusPercentage}%) pour votre premier dépôt.`,
          type: 'TRANSACTION',
          metadata: {
            transactionId: firstDepositTransaction.id.toString(),
            bonusAmount: firstDepositBonusAmount,
            bonusPercentage: firstDepositBonusPercentage
          }
        }
      })
    }
  } catch (error) {
    console.error('Error handling first deposit bonus:', error)
    throw error
  }
}

// Fonction pour gérer le bonus de parrainage (maintenue pour compatibilité)
async function handleReferralBonus(
  tx: any,
  transaction: any,
  depositAmount: number,
) {
  // Cette fonction est maintenant remplacée par handleAllBonuses
  // Mais maintenue pour éviter les erreurs de compilation
  console.log('handleReferralBonus is deprecated, use handleAllBonuses instead')
}