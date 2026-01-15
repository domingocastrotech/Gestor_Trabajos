import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  type: 'task' | 'vacation-request';
  title: string;
  message: string;
  avatar?: string;
  employeeName?: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private notificationId = 1;

  constructor() {}

  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.notificationId++,
      timestamp: new Date(),
      read: false
    };
    
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...currentNotifications]);
  }

  markAsRead(notificationId: number): void {
    const notifications = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(notifications);
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(notifications);
  }

  clearNotification(notificationId: number): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(notifications);
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
  }
}
