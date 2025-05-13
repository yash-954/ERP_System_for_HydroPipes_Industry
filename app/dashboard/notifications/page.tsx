'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import { 
  Bell, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Trash2, 
  CheckSquare,
  Plus
} from 'lucide-react';
import { Notification, NotificationType, NotificationStatus } from '@/app/models/Notification';
import notificationService from '@/app/lib/services/notificationService';
import useNotifications from '@/app/hooks/useNotifications';
import '@/app/styles/notifications.css';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: NotificationType.INFO,
    isSystemWide: false
  });
  
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    sendSystemNotification
  } = useNotifications({ userId: user?.id || 0 });

  // Handle creating a test notification
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      if (formData.isSystemWide) {
        // Send system-wide notification
        await sendSystemNotification(
          formData.title,
          formData.message,
          formData.type as NotificationType
        );
      } else {
        // Send personal notification
        await sendNotification(
          formData.title,
          formData.message,
          formData.type as NotificationType
        );
      }
      
      // Reset form and hide the creation form
      setFormData({
        title: '',
        message: '',
        type: NotificationType.INFO,
        isSystemWide: false
      });
      setIsCreating(false);
      
      // Refresh notifications
      await refetch();
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INFO:
        return <Info className="notification-icon info" />;
      case NotificationType.WARNING:
        return <AlertTriangle className="notification-icon warning" />;
      case NotificationType.ERROR:
        return <AlertCircle className="notification-icon error" />;
      case NotificationType.SUCCESS:
        return <CheckCircle className="notification-icon success" />;
      default:
        return <Info className="notification-icon info" />;
    }
  };

  // Format date to readable format
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <DashboardLayout pageTitle="Notifications Management">
      <div className="notifications-container">
        <div className="notifications-header">
          <div className="header-title">
            <Bell className="header-icon" />
            <h2 className="page-title">Your Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">
                {unreadCount} unread
              </span>
            )}
          </div>
          
          <div className="header-actions">
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="btn btn-secondary"
              >
                <CheckSquare className="btn-icon" />
                Mark all as read
              </button>
            )}
            
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="btn btn-primary"
            >
              <Plus className="btn-icon" />
              Create Notification
            </button>
          </div>
        </div>
        
        {isCreating && (
          <div className="creation-form">
            <h3 className="form-title">Create Test Notification</h3>
            <form onSubmit={handleCreateNotification}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="form-textarea"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationType })}
                    className="form-select"
                  >
                    <option value={NotificationType.INFO}>Info</option>
                    <option value={NotificationType.SUCCESS}>Success</option>
                    <option value={NotificationType.WARNING}>Warning</option>
                    <option value={NotificationType.ERROR}>Error</option>
                    <option value={NotificationType.MESSAGE}>Message</option>
                  </select>
                </div>

                <div className="form-checkbox-group">
                  <input
                    type="checkbox"
                    id="system-wide"
                    checked={formData.isSystemWide}
                    onChange={(e) => setFormData({ ...formData, isSystemWide: e.target.checked })}
                    className="form-checkbox"
                  />
                  <label htmlFor="system-wide" className="form-label">
                    Send to all active users (system-wide)
                  </label>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                >
                  Send Notification
                </button>
              </div>
            </form>
          </div>
        )}
        
        {isLoading ? (
          <div className="loading-container">
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-header">
              <AlertCircle className="error-icon" />
              <div>
                <h3 className="error-title">
                  Error loading notifications
                </h3>
                <div className="error-message">
                  <p>{error.message}</p>
                </div>
              </div>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="list-empty">
            <Bell className="empty-icon" />
            <p className="empty-title">No notifications yet</p>
            <p className="empty-subtitle">Notifications will appear here when you receive them</p>
          </div>
        ) : (
          <div className="notifications-list">
            <ul>
              {notifications.map((notification) => (
                <li 
                  key={notification.id} 
                  className={`notification-item ${notification.status === NotificationStatus.UNREAD ? 'notification-unread' : ''}`}
                >
                  <div className="notification-content">
                    <div className="notification-icon-container">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-body">
                      <div className="notification-header">
                        <h4 className="notification-title">{notification.title}</h4>
                        <div className="notification-actions">
                          {notification.status === NotificationStatus.UNREAD && (
                            <button 
                              onClick={() => notification.id && markAsRead(notification.id)}
                              className="action-button mark-read"
                              title="Mark as read"
                            >
                              <CheckSquare size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => notification.id && deleteNotification(notification.id)}
                            className="action-button delete"
                            title="Delete notification"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="notification-message">{notification.message}</p>
                      <div className="notification-meta">
                        <span className="notification-date">
                          {notification.createdAt && formatDate(notification.createdAt)}
                        </span>
                        {notification.isSystemWide && (
                          <span className="notification-system">System notification</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 