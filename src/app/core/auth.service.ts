import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  login(username: string, password: string) {
    return this.api.login(username, password).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        const rawUsername = response.username;
        const normalizedUsername = typeof rawUsername === 'string' && rawUsername.trim()
          ? rawUsername.trim()
          : '';
        localStorage.setItem('username', normalizedUsername);
        localStorage.setItem('rol', response.rol);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('rol');
    this.router.navigateByUrl('/login');
  }

  isLogged(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp || payload.exp * 1000 <= Date.now()) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  get username(): string {
    const username = localStorage.getItem('username') || '';
    if (!username || /com\.libreria\.auth\.model\.Usuario|\$\$Lambda/.test(username)) {
      return 'USUARIO';
    }
    return username.toUpperCase();
  }
}
