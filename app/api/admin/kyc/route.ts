import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Roles } from '@/app/lib/auth.config';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth.config';
import { KycStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== Roles.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statusParam = searchParams.get('status') || 'all';
    const skip = (page - 1) * limit;

    // Construire le filtre de statut avec le type correct
    const statusFilter = statusParam !== 'all' ? { 
      status: statusParam as KycStatus 
    } : {};

    const [kycVerifications, total] = await Promise.all([
      prisma.kycVerification.findMany({
        where: statusFilter,
        include: {
          user: {
            select: {
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.kycVerification.count({
        where: statusFilter,
      }),
    ]);

    // Formater les données pour le client
    const formattedKyc = kycVerifications.map(kyc => ({
      id: kyc.id.toString(),
      user_id: kyc.user_id.toString(),
      user: {
        email: kyc.user.email,
        first_name: kyc.user.first_name,
        last_name: kyc.user.last_name,
      },
      document_type: kyc.document_type,
      document_number: kyc.document_number,
      document_front_url: kyc.document_front_url,
      document_back_url: kyc.document_back_url,
      selfie_url: kyc.selfie_url,
      status: kyc.status,
      rejection_reason: kyc.rejection_reason,
      reviewed_by: kyc.reviewed_by?.toString() || null,
      reviewed_at: kyc.reviewed_at?.toISOString() || null,
      created_at: kyc.created_at.toISOString(),
      updated_at: kyc.updated_at.toISOString(),
    }));

    return NextResponse.json({
      kycVerifications: formattedKyc,
      total,
      page,
      limit,
    });

  } catch (error) {
    console.error('Error fetching KYC verifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}