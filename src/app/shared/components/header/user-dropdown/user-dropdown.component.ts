import { Component, ChangeDetectorRef } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService } from '../../../services/auth.service';
import { Utf8FixPipe } from '../../../pipes/utf8-fix.pipe';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent {
  isOpen = false;
  private utf8Fix = new Utf8FixPipe();

  constructor(public authService: AuthService, private cdr: ChangeDetectorRef) {}

  get user() {
    return this.authService.user;
  }

  get userName() {
    const name = this.user?.name || 'Usuario';
    return this.utf8Fix.transform(name);
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
    this.cdr.detectChanges();
  }

  closeDropdown() {
    this.isOpen = false;
    this.cdr.detectChanges();
  }

  signOut() {
    this.closeDropdown();
    this.authService.signOut();
  }
}
