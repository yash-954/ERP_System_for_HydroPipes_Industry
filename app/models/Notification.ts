// Notification types (info, warning, error, success)
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  MESSAGE = 'message'
}

// Notification status (read, unread)
export enum NotificationStatus {
  READ = 'read',
  UNREAD = 'unread'
}

// Notification interface
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  link?: string;
  createdAt: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
}

export type NotificationCreateInput = Omit<Notification, 'id' | 'createdAt' | 'readAt'> & {
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  status?: NotificationStatus;
  link?: string;
  metadata?: Record<string, any>;
};

export type NotificationUpdateInput = Partial<Omit<Notification, 'id' | 'createdAt'>>;

export default Notification; 