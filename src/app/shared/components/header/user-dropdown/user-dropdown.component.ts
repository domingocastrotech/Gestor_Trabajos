import { Component } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent {
  isOpen = false;

  constructor(public authService: AuthService) {}

  get user() {
    return this.authService.user;
  }

  get userName() {
    return this.user?.name || 'Usuario';
  }

  get userEmail() {
    return this.user?.email || 'email@example.com';
  }

  get userPicture() {
    return this.user?.picture || '/images/user/owner.png';
  }

  get firstName() {
    return this.userName.split(' ')[0] || 'Usuario';
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  signOut() {
    this.closeDropdown();
    this.authService.signOut();
  }
}