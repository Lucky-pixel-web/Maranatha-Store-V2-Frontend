import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-title">
      <div>
        <h2>Editar perfil</h2>
        <p>Actualiza tu información de usuario.</p>
      </div>
    </div>
    <div class="panel">
      <p><strong>Usuario:</strong> {{ auth.username }}</p>
      <p><strong>Rol:</strong> {{ rol }}</p>
      <p>Por ahora esta es una vista de perfil. Agrega los campos que quieras editar.</p>
      <button type="button" routerLink="/">Volver al dashboard</button>
    </div>
  `
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  readonly rol = localStorage.getItem('rol') || 'ADMIN';
}
