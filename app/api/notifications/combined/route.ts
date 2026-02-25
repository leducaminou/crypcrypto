import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 });
    }

    // Récupérer les notifications personnelles
    const personalNotifications = await prisma.notification.findMany({
      where: {
        user_id: BigInt(userId),
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 20,
    });

    // Récupérer les alertes système actives
    const systemAlerts = await prisma.systemAlert.findMany({
      where: {
        is_active: true,
        start_date: {
          lte: new Date(),
        },
        OR: [
          { end_date: null },
          { end_date: { gte: new Date() } }
        ]
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
    });

    // Filtrer les alertes système par rôle
    const filteredSystemAlerts = systemAlerts.filter(alert => {
      // Les alertes CRITIQUES sont pour tout le monde
      if (alert.level === 'CRITICAL') return true;
      
      // Les alertes WARNING sont pour les admins et utilisateurs
      if (alert.level === 'WARNING') return true;
      
      // Les autres alertes sont pour tout le monde
      return true;
    });

    const unreadCount = personalNotifications.filter(notif => !notif.is_read).length;

    // Convertir BigInt en string pour la sérialisation JSON
    const serializedNotifications = personalNotifications.map(notif => ({
      ...notif,
      id: notif.id.toString(),
      user_id: notif.user_id.toString(),
      created_at: notif.created_at.toISOString(),
      read_at: notif.read_at?.toISOString() || null,
    }));

    const serializedSystemAlerts = filteredSystemAlerts.map(alert => ({
      ...alert,
      id: alert.id.toString(),
      start_date: alert.start_date.toISOString(),
      end_date: alert.end_date?.toISOString() || null,
      created_at: alert.created_at.toISOString(),
    }));

    return NextResponse.json({
      personalNotifications: serializedNotifications,
      systemAlerts: serializedSystemAlerts,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}