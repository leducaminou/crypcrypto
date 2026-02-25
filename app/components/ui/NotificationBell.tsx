'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Notification, SystemAlert } from '@/types';

interface NotificationBellProps {
  userId: string;
  userRole: string;
}

export default function NotificationBell({ userId, userRole }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId, userRole]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications/combined?userId=${userId}&role=${userRole}`);
      const data = await response.json();
      
      setNotifications(data.personalNotifications || []);
      setSystemAlerts(data.systemAlerts || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string | bigint) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'border-red-400 bg-red-400/10';
      case 'WARNING':
        return 'border-yellow-400 bg-yellow-400/10';
      case 'SUCCESS':
        return 'border-green-400 bg-green-400/10';
      default:
        return 'border-cyan-400 bg-cyan-400/10';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const allNotifications = [
    ...systemAlerts.map(alert => ({
      ...alert,
      isSystemAlert: true,
      timestamp: new Date(alert.start_date)
    })),
    ...notifications.map(notif => ({
      ...notif,
      isSystemAlert: false,
      timestamp: new Date(notif.created_at)
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 relative transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-400 text-gray-900 text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* En-tête */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="overflow-y-auto max-h-64">
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                Chargement...
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                Aucune notification
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {allNotifications.map((item) => (
                  <div
                    key={item.isSystemAlert ? `alert-${item.id}` : `notif-${item.id}`}
                    className={`p-4 hover:bg-gray-750 transition-colors duration-150 ${
                      !item.isSystemAlert && !(item as Notification).is_read ? 'bg-gray-750/50' : ''
                    }`}
                  >
                    {item.isSystemAlert ? (
                      // Alerte système
                      <div className={`border-l-2 pl-3 ${getAlertColor((item as SystemAlert).level)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2 mb-1">
                            {getAlertIcon((item as SystemAlert).level)}
                            <span className="text-sm font-medium text-white">
                              {(item as SystemAlert).title}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatTime(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          {(item as SystemAlert).message}
                        </p>
                      </div>
                    ) : (
                      // Notification personnelle
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-medium ${
                              (item as Notification).is_read ? 'text-gray-300' : 'text-white'
                            }`}>
                              {(item as Notification).title}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTime(item.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {(item as Notification).message}
                          </p>
                          {!(item as Notification).is_read && (
                            <button
                              onClick={() => markAsRead((item as Notification).id)}
                              className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pied de page */}
          <div className="p-3 border-t border-gray-700 bg-gray-850">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}