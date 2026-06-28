import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-title">
      <div>
        <h2>Cambiar contraseña</h2>
        <p>Actualiza tu contraseña de acceso.</p>
      </div>
    </div>
    <div class="panel">
      <form class="profile-form" (ngSubmit)="guardar()">
        <label>Contraseña actual
          <input type="password" [(ngModel)]="currentPassword" name="currentPassword" required>
        </label>
        <label>Nueva contraseña
          <input type="password" [(ngModel)]="newPassword" name="newPassword" required>
        </label>
        <label>Confirmar contraseña
          <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required>
        </label>
        <button [disabled]="saving">{{ saving ? 'Guardando...' : 'Guardar cambios' }}</button>
        <small class="error" *ngIf="error">{{ error }}</small>
        <small class="success" *ngIf="success">{{ success }}</small>
      </form>
    </div>
  `
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  error = '';
  success = '';
  saving = false;

  guardar(): void {
    this.error = '';
    this.success = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.error = 'Todos los campos son obligatorios.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'La nueva contraseña y la confirmación no coinciden.';
      return;
    }

    this.saving = true;
    setTimeout(() => {
      this.saving = false;
      this.success = 'Contraseña actualizada con éxito.';
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    }, 1000);
  }
}
