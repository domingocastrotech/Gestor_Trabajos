import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

declare const google: any;

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSignal = signal<GoogleUser | null>(null);
  private readonly storageKey = 'googleUser';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    console.log('[AuthService] Initializing...');
    this.restoreUser();
    console.log('[AuthService] Initialized. User:', this.userSignal());
  }

  get user(): GoogleUser | null {
    return this.userSignal();
  }

  isAuthenticated(): boolean {
    const u = this.userSignal();
    const result = !!(u && u.id && u.email);
    console.log('[AuthService] isAuthenticated check:', result, 'User:', u);
    return result;
  }

  initializeGoogleSignIn(callback: (response: any) => void): boolean {
    if (!this.isBrowser() || typeof google === 'undefined') {
      return false;
    }

    google.accounts.id.disableAutoSelect();

    google.accounts.id.initialize({
      client_id: '661361477373-3jijr0saclt1i9ts88ru92b6f044pfl6.apps.googleusercontent.com',
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup',
      use_fedcm_for_prompt: true,
      callback,
    });

    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        width: 340,
        shape: 'pill',
      },
    );

    return true;
  }

  handleCredentialResponse(response: any): GoogleUser | null {
    if (!response?.credential) {
      return null;
    }

    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const user: GoogleUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name || '',
      picture: payload.picture,
    };

    this.userSignal.set(user);

    if (this.isBrowser()) {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    }

    return user;
  }

  signOut(): void {
    this.userSignal.set(null);

    if (this.isBrowser()) {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(this.storageKey);
    }

    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }

    this.router.navigate(['/signin']);
  }

  private restoreUser(): void {
    console.log('[AuthService] restoreUser: Starting...');
    if (!this.isBrowser()) {
      console.log('[AuthService] restoreUser: Not in browser, skipping');
      return;
    }

    const raw = localStorage.getItem(this.storageKey);
    console.log('[AuthService] restoreUser: localStorage data:', raw ? 'found' : 'not found');
    if (!raw) {
      return;
    }

    try {
      const stored = JSON.parse(raw) as GoogleUser;
      this.userSignal.set(stored);
      console.log('[AuthService] restoreUser: User restored:', stored.email);
    } catch (err) {
      console.error('[AuthService] restoreUser: Failed to parse user data', err);
      localStorage.removeItem(this.storageKey);
    }
  }

  private ensureUTF8(str: string): string {
    if (!str) return str;
    try {
      // Asegurar que el string está correctamente interpretado como UTF-8
      return decodeURIComponent(encodeURIComponent(str));
    } catch {
      return str;
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}