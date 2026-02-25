import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'


// Interface pour les paramètres de route dans Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function GET(
  request: Request, 
  { params }: RouteParams
) {

  
  try {

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const id = resolvedParams.id

    // Validate user ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const userId = BigInt(id)

    // Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        country: true,
        profile: true,
        kycVerifications: {
          orderBy: { created_at: 'desc' },
          take: 1 // Get the most recent KYC verification
        },
        paymentAccounts: true,
        referralsAsReferrer: {
          include: {
            referee: {
              include: {
                transactions: {
                  where: {
                    type: 'DEPOSIT',
                    status: 'COMPLETED'
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate referral stats
    let totalEarned = 0
    let pendingRewards = 0
    let activeReferrals = 0

    const referredUsers = user.referralsAsReferrer.map(ref => {
      const hasDeposits = ref.referee.transactions.length > 0
      const userEarnings = ref.referee.transactions.reduce((sum, tx) => {
        const amount = Number(tx.amount) * 0.1 // 10% commission
        totalEarned += amount
        pendingRewards += amount
        return sum + amount
      }, 0)

      if (hasDeposits) {
        activeReferrals++
      }

      return {
        id: ref.referee.id.toString(),
        email: ref.referee.email,
        created_at: ref.referee.created_at.toISOString(),
        is_active: ref.referee.is_active,
        has_deposits: hasDeposits,
        transactions: ref.referee.transactions.map(tx => ({
          amount: tx.amount.toString()
        }))
      }
    })

    // Prepare wallets data
    const wallets = user.wallet.map(wallet => ({
      id: wallet.id.toString(),
      user_id: wallet.user_id.toString(),
      balance: wallet.balance.toString(),
      locked_balance: wallet.locked_balance.toString(),
      type: wallet.type,
      created_at: wallet.created_at.toISOString(),
      updated_at: wallet.updated_at.toISOString()
    }))

    // Prepare payment accounts data
    const paymentAccounts = user.paymentAccounts.map(account => ({
      id: account.id.toString(),
      user_id: account.user_id.toString(),
      type: account.type,
      account_identifier: account.account_identifier,
      provider: account.provider,
      is_default: account.is_default,
      created_at: account.created_at.toISOString(),
      updated_at: account.updated_at.toISOString()
    }))

    // Prepare KYC verification data (most recent)
    const kycVerification = user.kycVerifications.length > 0 
      ? {
          id: user.kycVerifications[0].id.toString(),
          user_id: user.kycVerifications[0].user_id.toString(),
          document_type: user.kycVerifications[0].document_type,
          document_number: user.kycVerifications[0].document_number,
          document_front_url: user.kycVerifications[0].document_front_url,
          document_back_url: user.kycVerifications[0].document_back_url,
          selfie_url: user.kycVerifications[0].selfie_url,
          status: user.kycVerifications[0].status,
          rejection_reason: user.kycVerifications[0].rejection_reason,
          reviewed_by: user.kycVerifications[0].reviewed_by?.toString() || null,
          reviewed_at: user.kycVerifications[0].reviewed_at?.toISOString() || null,
          created_at: user.kycVerifications[0].created_at.toISOString(),
          updated_at: user.kycVerifications[0].updated_at.toISOString()
        }
      : null

    // Prepare profile data
    const profile = user.profile ? {
      id: user.profile.id.toString(),
      user_id: user.profile.user_id.toString(),
      address: user.profile.address,
      city: user.profile.city,
      postal_code: user.profile.postal_code,
      date_of_birth: user.profile.date_of_birth?.toISOString() || null,
      gender: user.profile.gender,
      avatar_url: user.profile.avatar_url,
      timezone: user.profile.timezone,
      preferred_language: user.profile.preferred_language,
      created_at: user.profile.created_at.toISOString(),
      updated_at: user.profile.updated_at.toISOString()
    } : null

    // Prepare response
    const response = {
      user: {
        id: user.id.toString(),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        verification_token: user.verification_token,
        is_email_verified: user.is_email_verified,
        email_verified_at: user.email_verified_at?.toISOString() || null,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
        last_login_at: user.last_login_at?.toISOString() || null,
        last_login_ip: user.last_login_ip,
        remember_token: user.remember_token,
        is_active: user.is_active,
        is_locked: user.is_locked,
        referral_code: user.referral_code,
        referred_by: user.referred_by?.toString() || null,
        country: user.country ? {
          id: user.country.id.toString(),
          name: user.country.name,
          dial_code: user.country.dial_code,
          country_code: user.country.country_code,
        } : null
      },
      profile,
      wallets,
      paymentAccounts,
      kycVerification,
      referredUsers,
      referralStats: {
        totalReferrals: user.referralsAsReferrer.length,
        activeReferrals,
        totalEarned,
        pendingRewards,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}