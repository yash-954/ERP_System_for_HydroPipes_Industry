'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellOff, 
  Check, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  X
} from 'lucide-react';
import { Notification, NotificationType, NotificationStatus } from '@/app/models/Notification';
import notificationService from '@/app/lib/services/notificationService';
import { useRouter } from 'next/navigation';

interface NotificationCenterProps {
  userId: number;
  onNotificationClick?: (notification: Notification) => void;
}

export default function NotificationCenter({ 
  userId, 
  onNotificationClick 
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load notifications on initial render
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const userNotifications = await notificationService.getByUser(userId);
        const count = await notificationService.getUnreadCountByUser(userId);
        
        setNotifications(userNotifications);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [userId]);

  // Handle marking a notification as read
  const handleMarkAsRead = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (notification.id && notification.status === NotificationStatus.UNREAD) {
      try {
        await notificationService.markAsRead(notification.id);
        
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === notification.id 
            ? { ...n, status: NotificationStatus.READ } 
            : n
        ));
        
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(userId);
      
      // Update local state
      setNotifications(notifications.map(n => ({ 
        ...n, 
        status: NotificationStatus.READ 
      })));
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (notification.id && notification.status === NotificationStatus.UNREAD) {
      notificationService.markAsRead(notification.id)
        .then(() => {
          // Update local state
          setNotifications(notifications.map(n => 
            n.id === notification.id 
              ? { ...n, status: NotificationStatus.READ } 
              : n
          ));
          
          setUnreadCount(prev => Math.max(0, prev - 1));
        })
        .catch(error => {
          console.error('Error marking notification as read:', error);
        });
    }
    
    // Call custom click handler if provided
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INFO:
        return <Info className="text-blue-500" />;
      case NotificationType.WARNING:
        return <AlertTriangle className="text-amber-500" />;
      case NotificationType.ERROR:
        return <AlertCircle className="text-red-500" />;
      case NotificationType.SUCCESS:
        return <CheckCircle className="text-green-500" />;
      default:
        return <Info className="text-blue-500" />;
    }
  };

  // Format date to relative time (e.g., "2 hours ago")
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  // Get recent notifications limited to 5 for the dropdown
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        className="relative p-2 rounded-full text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        ) : null}
        <Bell className="h-6 w-6" />
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white shadow-lg rounded-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h3 className="text-lg font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 flex flex-col items-center">
                <BellOff className="h-8 w-8 mb-2" />
                <p>No notifications yet</p>
              </div>
            ) : (
              recentNotifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    notification.status === NotificationStatus.UNREAD 
                      ? 'bg-blue-50' 
                      : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        {notification.status === NotificationStatus.UNREAD && (
                          <button 
                            onClick={(e) => handleMarkAsRead(notification, e)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.createdAt && getRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2">
            <button 
              className="text-sm text-gray-500 hover:text-gray-700 w-full text-center"
              onClick={() => {
                // Navigate to notifications page
                router.push('/dashboard/notifications');
                setIsOpen(false);
              }}
            >
              {notifications.length > 5 ? `View all ${notifications.length} notifications` : 'View all notifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 