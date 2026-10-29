import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside>
        <div class="brand"><span class="logo">M</span><div><b>Maranatha</b><small>Store</small></div></div>
        <nav>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><span class="nav-icon">⌂</span><span class="nav-label">Inicio</span></a>
          <a routerLink="/productos" routerLinkActive="active"><span class="nav-icon">▤</span><span class="nav-label">Productos y stock</span></a>
          <a routerLink="/clientes" routerLinkActive="active"><span class="nav-icon">♙</span><span class="nav-label">Clientes</span></a>
          <a routerLink="/ventas" routerLinkActive="active"><span class="nav-icon">◇</span><span class="nav-label">Ventas y facturación</span></a>
          <a routerLink="/reportes" routerLinkActive="active"><span class="nav-icon">▥</span><span class="nav-label">Reportes Excel</span></a>
        </nav>
        <div class="sidebar-bottom"><span>MARANATHA STORE / V2</span>Gestión de tu librería, en un solo lugar.</div>
      </aside>
      <main>
        <header>
          <div><h1>Panel de gestión</h1><p>Inventario, clientes y ventas</p></div>
          <div class="user-menu" #userMenu>
            <button type="button" class="user-menu-toggle" (click)="toggleMenu()">
              {{ auth.username }} <span class="chevron">▾</span>
            </button>
            <div class="user-menu-panel" *ngIf="showMenu">
              <a routerLink="/perfil" routerLinkActive="active" (click)="closeMenu()">Editar perfil</a>
              <a routerLink="/cambiar-contrasena" routerLinkActive="active" (click)="closeMenu()">Cambiar contraseña</a>
              <button type="button" class="logout secondary" (click)="logout()">Cerrar sesión</button>
            </div>
          </div>
        </header>
        <section class="content"><router-outlet/></section>
      </main>
    </div>
  `
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly rol = localStorage.getItem('rol') || 'ADMIN';
  showMenu = false;

  @ViewChild('userMenu', { read: ElementRef }) userMenu?: ElementRef<HTMLElement>;

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  closeMenu(): void {
    this.showMenu = false;
  }

  logout(): void {
    this.auth.logout();
    this.closeMenu();
  }

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: HTMLElement): void {
    const menuElement = this.userMenu?.nativeElement;
    if (this.showMenu && menuElement && !menuElement.contains(target)) {
      this.closeMenu();
    }
  }
}
