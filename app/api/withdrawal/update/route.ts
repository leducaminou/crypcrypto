import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/lib/auth.config'

interface UpdateWithdrawalRequest {
  withdrawalId: string
  action: 'approve' | 'reject'
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification de l'admin
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body: UpdateWithdrawalRequest = await request.json()
    const { withdrawalId, action } = body

    // Convertir les IDs en BigInt
    const withdrawalIdBigInt = BigInt(withdrawalId)
    const adminIdBigInt = BigInt(session.user.id)

    // Récupérer le withdrawal avec toutes les données nécessaires
    const withdrawal = await prisma.withdrawal.findUnique({
      where: {
        id: withdrawalIdBigInt
      },
      include: {
        transaction: {
          include: {
            wallet: {
              include: {
                user: true
              }
            }
          }
        },
        user: true
      }
    })

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Retrait non trouvé' },
        { status: 404 }
      )
    }

    if (!withdrawal.transaction) {
      return NextResponse.json(
        { error: 'Transaction associée non trouvée' },
        { status: 404 }
      )
    }

    if (withdrawal.transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Le retrait a déjà été traité' },
        { status: 400 }
      )
    }

    const transaction = withdrawal.transaction
    const amount = Number(transaction.amount)

    // Commencer une transaction pour garantir l'intégrité des données
    const result = await prisma.$transaction(async (tx) => {
      const newStatus = action === 'approve' ? 'COMPLETED' : 'CANCELLED'

      // 1. Mettre à jour le statut de la transaction existante
      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: newStatus,
          processed_at: new Date()
        }
      })

      // 2. Mettre à jour le statut du retrait
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalIdBigInt },
        data: { 
          ...(action === 'approve' && {
            approved_at: new Date(),
            approved_by: adminIdBigInt
          }),
          ...(action === 'reject' && {
            rejection_reason: 'Rejeté par l\'administrateur'
          })
        }
      })

      // 3. Si rejet, rembourser le wallet depuis lequel la demande a été faite
      if (action === 'reject') {
        await tx.wallet.update({
          where: { id: transaction.wallet_id },
          data: {
            balance: {
              increment: amount
            }
          }
        })
      }

      // Créer une notification pour l'utilisateur
      await tx.notification.create({
        data: {
          user_id: withdrawal.user_id,
          title: action === 'approve' ? 'Retrait approuvé' : 'Retrait rejeté',
          message: action === 'approve' 
            ? `Votre retrait de ${amount}$ a été approuvé et traité.` 
            : `Votre retrait de ${amount}$ a été rejeté par l'administrateur.`,
          type: 'TRANSACTION',
          metadata: {
            withdrawalId: withdrawalId,
            amount: amount,
            
            action: action
          }
        }
      })

      // Créer une activité admin pour l'audit
      await tx.adminActivity.create({
        data: {
          user_id: adminIdBigInt,
          action: `WITHDRAWAL_${action.toUpperCase()}`,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            withdrawalId: withdrawalId,
            userId: withdrawal.user_id.toString(),
            amount: amount,
            
            action: action
          }
        }
      })

      return { 
        withdrawal: {
          id: updatedWithdrawal.id.toString(),
          status: newStatus
        },
        transaction: {
          id: updatedTransaction.id.toString(),
          status: newStatus
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Retrait ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
      data: result
    })

  } catch (error) {
    console.error('Error updating withdrawal:', error)
    
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
          details: 'Une erreur est survenue lors du traitement du retrait'
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