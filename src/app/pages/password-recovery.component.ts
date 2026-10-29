import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="recovery-page">
      <div class="recovery-glow recovery-glow-a" aria-hidden="true"></div>
      <div class="recovery-glow recovery-glow-b" aria-hidden="true"></div>
      <div class="recovery-shell">
        <header class="recovery-header">
          <div class="recovery-brand">
            <img src="/maranatha-logo.png" alt="Librería Maranatha" (error)="logoError($event)">
            <span>MARANATHA STORE</span>
          </div>
          <a routerLink="/login" class="recovery-return">← Volver al login</a>
        </header>
        <section class="recovery-card" aria-labelledby="recover-title">
          <span class="recovery-eyebrow">SEGURIDAD DE TU CUENTA</span>
          <div class="recovery-progress" aria-label="Flujo de recuperación">
            <span [class.current]="paso==='correo'">01 Correo</span>
            <span class="progress-line"></span>
            <span [class.current]="paso==='codigo'">02 Verificación</span>
          </div>
          <div class="recovery-stage" [attr.data-step]="paso">
            <ng-container *ngIf="paso==='correo'; else codeStage">
              <div class="recovery-icon" aria-hidden="true">✉</div>
              <h1 id="recover-title">Recupera tu acceso.</h1>
              <p>Escribe el correo electrónico asociado con tu cuenta. La recuperación automática aún no está conectada al servicio de autenticación.</p>
              <form (ngSubmit)="continuar()" novalidate>
                <label for="recover-email">Correo electrónico</label>
                <input id="recover-email" name="correo" type="email" autocomplete="email" required
                  [(ngModel)]="correo" placeholder="nombre@ejemplo.com" [class.recovery-invalid]="error"
                  (input)="error=''">
                <p *ngIf="error" class="recovery-warning" role="alert">{{ error }}</p>
                <button type="submit" class="recovery-primary">Ver cómo funciona <span>→</span></button>
              </form>
            </ng-container>
            <ng-template #codeStage>
              <div class="recovery-icon recovery-key" aria-hidden="true">✦</div>
              <h1 id="recover-title">Verificación por correo.</h1>
              <p>Este es el diseño previsto para introducir un código de seguridad. <strong>No se ha enviado ningún código.</strong></p>
              <p class="recovery-email-label">Correo indicado: {{ correo }}</p>
              <div class="recovery-code" aria-label="Casillas de código no habilitadas">
                <span *ngFor="let index of codigoCasillas" aria-hidden="true">•</span>
              </div>
              <div class="recovery-warning" role="status">Pendiente de integración: envío de correo, validación de OTP y restablecimiento seguro de contraseña. No se puede completar esta operación sin backend.</div>
              <button type="button" class="recovery-primary" (click)="volver()">← Cambiar correo</button>
            </ng-template>
          </div>
          <div class="recovery-footer">Tu contraseña nunca debe enviarse por correo ni almacenarse en este formulario.</div>
        </section>
      </div>
    </main>
  `
})
export class PasswordRecoveryComponent {
  correo = '';
  error = '';
  paso: 'correo' | 'codigo' = 'correo';
  readonly codigoCasillas = [0, 1, 2, 3, 4, 5];

  logoError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  continuar(): void {
    const correo = this.correo.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      this.error = 'Introduce una dirección de correo válida.';
      return;
    }
    this.correo = correo;
    this.error = '';
    this.paso = 'codigo';
  }

  volver(): void {
    this.paso = 'correo';
    this.error = '';
  }
}
