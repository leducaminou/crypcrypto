import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
  try {
    const countries = await prisma.countries.findMany({
      where: { is_active: true }
    });

    // Convertir les BigInt en string pour éviter les erreurs de sérialisation
    const serializedCountries = countries.map(country => ({
      ...country,
      id: country.id.toString(),
    }));

    return NextResponse.json(serializedCountries); // Changé de serializedPlans à serializedCountries
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}