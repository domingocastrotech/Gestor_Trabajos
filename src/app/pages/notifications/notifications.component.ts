import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../shared/services/notification.service';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  isLoading = false;
  showDeleteConfirm = false;
  notificationToDelete: number | null = null;

  constructor(private notificationService: NotificationService) {}

  async ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = [...notifications].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'task':
        return '📋';
      case 'vacation-request':
        return '🏖️';
      default:
        return '📌';
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000);

    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
    if (diff < 2592000) return `Hace ${Math.floor(diff / 604800)} semanas`;
    return new Date(timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async deleteNotification(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.notificationToDelete = id;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.notificationToDelete = null;
  }

  async confirmDelete() {
    if (this.notificationToDelete) {
      try {
        await this.notificationService.clearNotification(this.notificationToDelete);
        this.closeDeleteConfirm();
      } catch (error) {
        console.error('Error eliminando notificación:', error);
      }
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  async markAllAsRead() {
    try {
      await this.notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marcando notificaciones como leídas:', error);
    }
  }

  async clearAllNotifications() {
    if (confirm('¿Está seguro de que desea eliminar todas las notificaciones?')) {
      try {
        await this.notificationService.clearAll();
      } catch (error) {
        console.error('Error eliminando todas las notificaciones:', error);
      }
    }
  }

  async markNotificationAsRead(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    try {
      await this.notificationService.markAsRead(id);
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  }

  openDeleteConfirm(id: number) {
    this.notificationToDelete = id;
    this.showDeleteConfirm = true;
  }
}
