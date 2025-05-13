import { db, LocalNotification } from '../db/localDb';
import { 
  Notification, 
  NotificationType, 
  NotificationStatus 
} from '../../models/Notification';

/**
 * Service for managing user notifications
 */
const notificationService = {
  /**
   * Get all notifications
   */
  getAll: async (): Promise<Notification[]> => {
    try {
      return await db.notifications.toArray();
    } catch (error) {
      console.error('Error in getAll notifications:', error);
      throw error;
    }
  },

  /**
   * Get notification by ID
   */
  getById: async (id: number): Promise<Notification | undefined> => {
    try {
      return await db.notifications.get(id);
    } catch (error) {
      console.error(`Error in getById notification (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Get notifications for a specific user
   */
  getByUser: async (userId: number): Promise<Notification[]> => {
    try {
      return await db.notifications
        .where('userId')
        .equals(userId)
        .reverse()
        .sortBy('createdAt');
    } catch (error) {
      console.error(`Error in getByUser notifications (userId: ${userId}):`, error);
      throw error;
    }
  },

  /**
   * Get unread notifications for a specific user
   */
  getUnreadByUser: async (userId: number): Promise<Notification[]> => {
    try {
      return await db.notifications
        .where('userId')
        .equals(userId)
        .and(item => item.status === NotificationStatus.UNREAD)
        .reverse()
        .sortBy('createdAt');
    } catch (error) {
      console.error(`Error in getUnreadByUser notifications (userId: ${userId}):`, error);
      throw error;
    }
  },

  /**
   * Get notification count for a specific user
   */
  getCountByUser: async (userId: number): Promise<number> => {
    try {
      return await db.notifications
        .where('userId')
        .equals(userId)
        .count();
    } catch (error) {
      console.error(`Error in getCountByUser notifications (userId: ${userId}):`, error);
      throw error;
    }
  },

  /**
   * Get unread notification count for a specific user
   */
  getUnreadCountByUser: async (userId: number): Promise<number> => {
    try {
      return await db.notifications
        .where('userId')
        .equals(userId)
        .and(item => item.status === NotificationStatus.UNREAD)
        .count();
    } catch (error) {
      console.error(`Error in getUnreadCountByUser notifications (userId: ${userId}):`, error);
      throw error;
    }
  },

  /**
   * Create a new notification
   */
  create: async (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => {
    try {
      const now = new Date();
      const newNotification: LocalNotification = {
        ...notification,
        status: notification.status || NotificationStatus.UNREAD,
        createdAt: now,
        updatedAt: now
      };
      
      return await db.notifications.add(newNotification);
    } catch (error) {
      console.error('Error in create notification:', error);
      throw error;
    }
  },

  /**
   * Update a notification
   */
  update: async (id: number, notification: Partial<Notification>): Promise<number> => {
    try {
      const updatedNotification = {
        ...notification,
        updatedAt: new Date()
      };
      
      return await db.notifications.update(id, updatedNotification);
    } catch (error) {
      console.error(`Error in update notification (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: number): Promise<number> => {
    try {
      return await db.notifications.update(id, {
        status: NotificationStatus.READ,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error in markAsRead notification (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: async (userId: number): Promise<number> => {
    try {
      const unreadNotifications = await db.notifications
        .where('userId')
        .equals(userId)
        .and(item => item.status === NotificationStatus.UNREAD)
        .toArray();
      
      const updatePromises = unreadNotifications.map(notification => 
        db.notifications.update(notification.id!, {
          status: NotificationStatus.READ,
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
      return unreadNotifications.length;
    } catch (error) {
      console.error(`Error in markAllAsRead notifications (userId: ${userId}):`, error);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  delete: async (id: number): Promise<void> => {
    try {
      await db.notifications.delete(id);
    } catch (error) {
      console.error(`Error in delete notification (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Delete all notifications for a user
   */
  deleteByUser: async (userId: number): Promise<number> => {
    try {
      return await db.notifications
        .where('userId')
        .equals(userId)
        .delete();
    } catch (error) {
      console.error(`Error in deleteByUser notifications (userId: ${userId}):`, error);
      throw error;
    }
  },

  /**
   * Delete old notifications (older than specified days)
   */
  deleteOldNotifications: async (days: number = 30): Promise<number> => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return await db.notifications
        .where('createdAt')
        .below(cutoffDate)
        .delete();
    } catch (error) {
      console.error(`Error in deleteOldNotifications (days: ${days}):`, error);
      throw error;
    }
  },

  /**
   * Send a notification to a user
   */
  sendToUser: async (
    userId: number, 
    title: string, 
    message: string, 
    type: NotificationType = NotificationType.INFO,
    entityType?: string,
    linkedEntityId?: number
  ): Promise<number> => {
    try {
      return await notificationService.create({
        userId,
        title,
        message,
        type,
        status: NotificationStatus.UNREAD,
        entityType,
        linkedEntityId
      });
    } catch (error) {
      console.error(`Error in sendToUser notification (userId: ${userId}):`, error);
      throw error;
    }
  },

  /**
   * Send notifications to multiple users
   */
  sendToUsers: async (
    userIds: number[], 
    title: string, 
    message: string, 
    type: NotificationType = NotificationType.INFO,
    entityType?: string,
    linkedEntityId?: number
  ): Promise<number[]> => {
    try {
      const notificationPromises = userIds.map(userId => 
        notificationService.create({
          userId,
          title,
          message,
          type,
          status: NotificationStatus.UNREAD,
          entityType,
          linkedEntityId
        })
      );
      
      return await Promise.all(notificationPromises);
    } catch (error) {
      console.error(`Error in sendToUsers notifications:`, error);
      throw error;
    }
  },

  /**
   * Send a system-wide notification to all active users
   */
  sendSystemNotification: async (
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    entityType?: string,
    linkedEntityId?: number
  ): Promise<number> => {
    try {
      // Import the database to get users
      const { db } = await import('../db/localDb');
      
      // Get all active users
      const activeUsers = await db.users
        .where('isActive')
        .equals(true)
        .toArray();
      
      // Get user IDs
      const userIds = activeUsers.map(user => user.id!);
      
      // Send notification to all users
      const notificationIds = await notificationService.sendToUsers(
        userIds,
        title,
        message,
        type,
        entityType,
        linkedEntityId
      );
      
      return notificationIds.length;
    } catch (error) {
      console.error('Error in sendSystemNotification:', error);
      throw error;
    }
  }
};

export default notificationService; 