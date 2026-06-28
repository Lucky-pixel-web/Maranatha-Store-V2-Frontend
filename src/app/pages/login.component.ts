import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiError } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <form class="login-card" (ngSubmit)="entrar()">
        <div class="login-logo">M</div>
        <h2>Maranatha Store</h2>
        <p>Sistema de Control V.1</p>
        <label>Usuario<input [(ngModel)]="usuario" name="usuario" required autocomplete="username"></label>
        <label>Contraseña<input type="password" [(ngModel)]="clave" name="clave" required autocomplete="current-password"></label>
        <button [disabled]="cargando">{{ cargando ? 'Ingresando...' : 'Ingresar' }}</button>
        <small class="error" *ngIf="error">{{ error }}</small>
        <small class="hint">Incia con tu cuenta</small>
      </form>
    </div>
  `
})
export class LoginComponent {
  usuario = '';
  clave = '';
  error = '';
  cargando = false;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  entrar(): void {
    this.error = '';
    this.cargando = true;
    this.auth.login(this.usuario.trim(), this.clave).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (error: HttpErrorResponse) => {
        const body = error.error as ApiError;
        this.error = body?.message || (error.status === 0
          ? 'No se puede conectar con el Gateway en el puerto 8080.'
          : 'Usuario o contraseña incorrectos.');
        this.cargando = false;
      }
    });
  }
}
