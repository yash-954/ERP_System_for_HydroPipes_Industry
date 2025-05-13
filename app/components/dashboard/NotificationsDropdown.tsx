'use client';

import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, AlertCircle, Info, Mail } from 'lucide-react';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import notificationService from '@/app/lib/services/notificationService';
import { Notification, NotificationType, NotificationStatus } from '@/app/models/Notification';

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications for current user
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const userNotifications = await notificationService.getByUser(user.id, 10);
      setNotifications(userNotifications);
      
      // Get unread count
      const count = await notificationService.getUnreadCountByUser(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and setup interval for periodic updates
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      
      // Set interval to check for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      
      // Clean up interval on unmount
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update notifications list
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: NotificationStatus.READ }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!user?.id || notifications.length === 0) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      
      // Update notifications list
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, status: NotificationStatus.READ }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case NotificationType.WARNING:
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case NotificationType.ERROR:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case NotificationType.MESSAGE:
        return <Mail className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format notification time
  const formatNotificationTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-expanded={isOpen}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white shadow-lg rounded-lg ring-1 ring-black ring-opacity-5 overflow-hidden z-10 max-h-96">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="divide-y divide-gray-200 overflow-y-auto max-h-80">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${
                    notification.status === NotificationStatus.UNREAD
                      ? 'bg-blue-50'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {notification.title}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {formatNotificationTime(notification.createdAt)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {notification.message}
                      </div>
                      
                      {notification.status === NotificationStatus.UNREAD && (
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Mark as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  // Navigate to notifications page
                  console.log('View all notifications');
                  setIsOpen(false);
                }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 