'use client';

import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationType, NotificationStatus } from '../models/Notification';
import notificationService from '../lib/services/notificationService';

interface UseNotificationsOptions {
  userId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Hook for managing notifications
 */
export function useNotifications({ 
  userId, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch notifications from the service
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const [allNotifications, unreadNotifications] = await Promise.all([
        notificationService.getByUser(userId),
        notificationService.getUnreadByUser(userId)
      ]);
      
      setNotifications(allNotifications);
      setUnreadNotifications(unreadNotifications);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial fetch and set up auto-refresh if enabled
  useEffect(() => {
    fetchNotifications();
    
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh && userId) {
      intervalId = setInterval(fetchNotifications, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [userId, autoRefresh, refreshInterval, fetchNotifications]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, status: NotificationStatus.READ }
            : notification
        )
      );
      
      setUnreadNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead(userId);
      
      // Update state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          status: NotificationStatus.READ 
        }))
      );
      
      setUnreadNotifications([]);
      
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [userId]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await notificationService.delete(notificationId);
      
      // Update state
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      setUnreadNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, []);

  // Send a notification to the current user
  const sendNotification = useCallback(async (
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    entityType?: string,
    linkedEntityId?: number
  ) => {
    try {
      const notificationId = await notificationService.sendToUser(
        userId,
        title,
        message,
        type,
        entityType,
        linkedEntityId
      );
      
      // Refresh notifications
      await fetchNotifications();
      
      return notificationId;
    } catch (err) {
      console.error('Error sending notification:', err);
      throw err;
    }
  }, [userId, fetchNotifications]);

  // Send a system notification to all active users
  const sendSystemNotification = useCallback(async (
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    entityType?: string,
    linkedEntityId?: number
  ) => {
    try {
      const count = await notificationService.sendSystemNotification(
        title,
        message,
        type,
        entityType,
        linkedEntityId
      );
      
      // Refresh notifications
      await fetchNotifications();
      
      return count;
    } catch (err) {
      console.error('Error sending system notification:', err);
      throw err;
    }
  }, [fetchNotifications]);

  return {
    notifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    sendSystemNotification
  };
}

export default useNotifications; 