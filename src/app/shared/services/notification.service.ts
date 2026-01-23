import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Notification {
  id: number;
  type: 'task' | 'vacation-request';
  title: string;
  message: string;
  recipient_email: string;
  timestamp: Date;
  read: boolean;
  data?: any;
  created_at?: string;
}

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'>;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    // No cargar notificaciones inmediatamente para evitar problemas de lock
    // Se cargarán cuando se llame explícitamente a loadNotifications()
  }

  private async loadNotifications(): Promise<void> {
    try {
      const session = await this.supabase.getSession();
      if (!session?.user?.email) {
        console.log('[NotificationService] No hay sesión activa, limpiando notificaciones');
        this.notificationsSubject.next([]);
        return;
      }

      console.log('[NotificationService] Cargando notificaciones para:', session.user.email);

      // Cargar solo las notificaciones del usuario actual basándose en su email
      const { data, error } = await this.supabase.supabase
        .from('notifications')
        .select('*')
        .eq('recipient_email', session.user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notifications: Notification[] = (data || []).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        recipient_email: n.recipient_email,
        timestamp: new Date(n.created_at),
        read: n.read,
        data: n.data,
        created_at: n.created_at
      }));

      console.log('[NotificationService] Notificaciones cargadas:', notifications.length);
      this.notificationsSubject.next(notifications);
    } catch (error) {
      console.error('[NotificationService] Error loading notifications:', error);
    }
  }

  // Método público para cargar notificaciones explícitamente
  async init(): Promise<void> {
    await this.loadNotifications();
  }

  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  async addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'created_at'>): Promise<void> {
    console.log('[NotificationService] 📤 Intentando crear notificación...');
    console.log('[NotificationService] Datos de notificación:', notification);

    try {
      const payload = {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        recipient_email: notification.recipient_email,
        read: false,
        data: notification.data
      };

      console.log('[NotificationService] Payload a insertar:', payload);

      const { data, error } = await this.supabase.supabase
        .from('notifications')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('[NotificationService] ❌ Error de Supabase al insertar:', error);
        console.error('[NotificationService] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('[NotificationService] ✅ Notificación insertada en BD:', data);

      const newNotification: Notification = {
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        recipient_email: data.recipient_email,
        timestamp: new Date(data.created_at),
        read: data.read,
        data: data.data,
        created_at: data.created_at
      };

      const currentNotifications = this.notificationsSubject.value;
      this.notificationsSubject.next([newNotification, ...currentNotifications]);
      console.log('[NotificationService] ✅ Notificación añadida al observable. Total:', currentNotifications.length + 1);
    } catch (error) {
      console.error('[NotificationService] ❌ Error adding notification:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      const { error } = await this.supabase.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      const notifications = this.notificationsSubject.value.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      this.notificationsSubject.next(notifications);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const session = await this.supabase.getSession();
      if (!session?.user?.email) return;

      const { error } = await this.supabase.supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_email', session.user.email)
        .eq('read', false);

      if (error) throw error;

      const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
      this.notificationsSubject.next(notifications);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async clearNotification(notificationId: number): Promise<void> {
    try {
      const { error } = await this.supabase.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
      this.notificationsSubject.next(notifications);
    } catch (error) {
      console.error('Error clearing notification:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      const session = await this.supabase.getSession();
      if (!session?.user?.email) return;

      const { error } = await this.supabase.supabase
        .from('notifications')
        .delete()
        .eq('recipient_email', session.user.email);

      if (error) throw error;

      this.notificationsSubject.next([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }
}
