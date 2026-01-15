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
  unreadCount = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = this.notificationService.getUnreadCount();
      this.notifying = this.unreadCount > 0;
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Marcar todas como leídas al abrir
      this.notificationService.markAllAsRead();
    }
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

  clearNotification(id: number) {
    this.notificationService.clearNotification(id);
  }
}