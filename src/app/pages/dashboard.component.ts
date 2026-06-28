import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-title"><div><h2>Resumen del negocio</h2><p>Indicadores principales en tiempo real</p></div></div>
    <div *ngIf="error" class="notice error-notice">{{ error }}</div>
    <div class="cards">
      <article><span>Productos</span><strong>{{ productos }}</strong><small>Registrados</small></article>
      <article><span>Stock bajo</span><strong>{{ stockBajo }}</strong><small>Requieren reposición</small></article>
      <article><span>Clientes</span><strong>{{ clientes }}</strong><small>Registrados</small></article>
      <article><span>Ventas emitidas</span><strong>{{ ventas }}</strong><small>No anuladas</small></article>
    </div>
    <div class="panel">
      <h3>Estado general</h3>
      <p>Los productos y clientes se almacenan en PostgreSQL. Cada venta valida existencias, calcula el total en el servidor, descuenta stock y genera una serie y número de comprobante.</p>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  productos = 0;
  stockBajo = 0;
  clientes = 0;
  ventas = 0;
  error = '';

  ngOnInit(): void {
    forkJoin([this.api.productos(), this.api.clientes(), this.api.ventas()]).subscribe({
      next: ([productos, clientes, ventas]) => {
        this.productos = productos.length;
        this.stockBajo = productos.filter(item => item.stock <= 5).length;
        this.clientes = clientes.length;
        this.ventas = ventas.filter(item => item.estado === 'EMITIDA').length;
      },
      error: () => this.error = 'No fue posible cargar los indicadores. Verifique que todos los servicios estén iniciados.'
    });
  }
}
