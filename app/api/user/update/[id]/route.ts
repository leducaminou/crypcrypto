import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { UserProfileSchema } from '@/app/lib/validations/ProfileShema'

// Interface pour les paramètres de route dans Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function PUT(
  request: Request, 
  { params }: RouteParams
) {

  
  try {

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const id = resolvedParams.id
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const userId = BigInt(id)
    const body = await request.json()

    // Validate request body
    const validation = UserProfileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      first_name,
      last_name,
      email,
      country_id,
      phone,
      date_of_birth,
      address,
      city,
      postal_code,
      gender
    } = validation.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user basic information
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        first_name,
        last_name,
        email,
        country_id: BigInt(country_id),
        phone,
        updated_at: new Date()
      }
    })

    // Check if user profile exists
    let userProfile
    if (existingUser.profile) {
      // Update existing profile
      userProfile = await prisma.userProfile.update({
        where: { user_id: userId },
        data: {
          address: address || null,
          city: city || null,
          postal_code: postal_code || null,
          gender: gender || null,
          date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
          updated_at: new Date()
        }
      })
    } else {
      // Create new profile
      userProfile = await prisma.userProfile.create({
        data: {
          user_id: userId,
          address: address || null,
          city: city || null,
          postal_code: postal_code || null,
          gender: gender || null,
          date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    }

    // Prepare response with serialized BigInt
    const response = {
      user: {
        id: updatedUser.id.toString(),
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
        country_id: updatedUser.country_id.toString(),
        created_at: updatedUser.created_at.toISOString(),
        updated_at: updatedUser.updated_at.toISOString()
      },
      profile: {
        id: userProfile.id.toString(),
        user_id: userProfile.user_id.toString(),
        address: userProfile.address,
        city: userProfile.city,
        postal_code: userProfile.postal_code,
        gender: userProfile.gender,
        date_of_birth: userProfile.date_of_birth?.toISOString(),
        created_at: userProfile.created_at.toISOString(),
        updated_at: userProfile.updated_at.toISOString()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}