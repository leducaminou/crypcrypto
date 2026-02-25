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
    // Validate payment account ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid payment account ID' },
        { status: 400 }
      )
    }

    const paymentAccountId = BigInt(id)

    // Fetch payment account with user and country info
    const paymentAccount = await prisma.paymentAccount.findUnique({
      where: { id: paymentAccountId },
      include: {
        user: {
          include: {
            country: true
          }
        }
      }
    })

    if (!paymentAccount) {
      return NextResponse.json(
        { error: 'Payment account not found' },
        { status: 404 }
      )
    }

    // Prepare response
    const response = {
      id: paymentAccount.id.toString(),
      type: paymentAccount.type,
      account_identifier: paymentAccount.account_identifier,
      provider: paymentAccount.provider,
      is_default: paymentAccount.is_default,
      user: {
        country: paymentAccount.user.country ? {
          name: paymentAccount.user.country.name,
        } : null
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching payment account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}