import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { NotificationService, Notification } from '../../../services/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemComponent]
})
export class NotificationDropdownComponent implements OnInit {
  isOpen = false;
  notifying = false;
  notifications: Notification[] = [];
  recentNotifications: Notification[] = []; // Solo las últimas 10 para el dropdown
  unreadCount = 0;
  showDeleteConfirm = false;
  notificationToDelete: number | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.recentNotifications = notifications.slice(0, 10); // Solo mostrar las 10 más recientes
      this.unreadCount = notifications.filter(n => !n.read).length;
      this.notifying = this.unreadCount > 0;
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    // No marcar automáticamente como leídas al abrir
  }

  closeDropdown() {
    this.isOpen = false;
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
    return `Hace ${Math.floor(diff / 86400)} días`;
  }

  async markNotificationAsRead(id: number) {
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
}
