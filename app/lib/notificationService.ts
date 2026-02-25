import { Notification, NotificationData, SystemAlert } from "@/types";


export async function getUserNotifications(userId: string, role: string): Promise<NotificationData> {
  try {
    // Récupérer les notifications personnelles
    const personalResponse = await fetch(`/api/notifications?userId=${userId}`);
    const personalData = await personalResponse.json();
    
    // Récupérer les alertes système actives
    const systemResponse = await fetch('/api/system-alerts');
    const systemData = await systemResponse.json();
    
    const personalNotifications: Notification[] = personalData.notifications || [];
    const systemAlerts: SystemAlert[] = systemData.alerts || [];
    
    // Filtrer les alertes système par rôle si nécessaire
    const filteredSystemAlerts = systemAlerts.filter(alert => 
      isAlertRelevantForUser(alert, role)
    );
    
    const unreadCount = personalNotifications.filter(notif => !notif.is_read).length;
    
    return {
      personalNotifications,
      systemAlerts: filteredSystemAlerts,
      unreadCount
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return {
      personalNotifications: [],
      systemAlerts: [],
      unreadCount: 0
    };
  }
}

function isAlertRelevantForUser(alert: SystemAlert, role: string): boolean {
  // Logique pour déterminer si l'alerte concerne l'utilisateur
  // Par exemple, certaines alertes critiques pour tous, d'autres seulement pour les admins
  if (alert.level === 'CRITICAL') return true;
  if (alert.level === 'WARNING' && role === 'ADMIN') return true;
  
  return alert.is_active && 
         new Date(alert.start_date) <= new Date() && 
         (!alert.end_date || new Date(alert.end_date) >= new Date());
}