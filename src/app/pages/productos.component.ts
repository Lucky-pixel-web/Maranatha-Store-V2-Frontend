import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../core/api.service';
import { ApiError, Producto } from '../models';

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page-title">
      <div><h2>Productos e inventario</h2><p>Control de precios y stock en PostgreSQL</p></div>
      <button (click)="nuevo()">+ Nuevo producto</button>
    </div>
    <div *ngIf="mensaje" class="notice" [class.error-notice]="esError">{{ mensaje }}</div>
    <div class="toolbar"><input placeholder="Buscar producto..." [(ngModel)]="q"></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Producto</th><th>Descripción</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let p of filtrados; trackBy: trackById">
            <td><b>{{ p.nombre }}</b></td>
            <td>{{ p.descripcion || '-' }}</td>
            <td>S/ {{ p.precio | number:'1.2-2' }}</td>
            <td>{{ p.stock }}</td>
            <td><span [class.danger]="p.stock <= 5" class="status">{{ p.stock <= 5 ? 'Stock bajo' : 'Disponible' }}</span></td>
            <td><button class="link" (click)="editar(p)">Editar</button><button class="link danger-text" (click)="eliminar(p)">Eliminar</button></td>
          </tr>
          <tr *ngIf="!filtrados.length"><td colspan="6" class="empty">No hay productos registrados.</td></tr>
        </tbody>
      </table>
    </div>

    <div class="modal" *ngIf="abierto">
      <form class="dialog" (ngSubmit)="guardar()">
        <h3>{{ form.id ? 'Editar' : 'Nuevo' }} producto</h3>
        <label>Nombre<input [(ngModel)]="form.nombre" name="nombre" required maxlength="150"></label>
        <label>Descripción<input [(ngModel)]="form.descripcion" name="descripcion" maxlength="500"></label>
        <div class="row">
          <label>Precio<input type="number" min="0" step="0.01" [(ngModel)]="form.precio" name="precio" required></label>
          <label>Stock<input type="number" min="0" step="1" [(ngModel)]="form.stock" name="stock" required></label>
        </div>
        <small class="error" *ngIf="errorFormulario">{{ errorFormulario }}</small>
        <div class="actions">
          <button type="button" class="secondary" (click)="abierto=false" [disabled]="procesando">Cancelar</button>
          <button [disabled]="procesando">{{ procesando ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </div>
  `
})
export class ProductosComponent implements OnInit {
  private readonly api = inject(ApiService);
  lista: Producto[] = [];
  q = '';
  abierto = false;
  procesando = false;
  mensaje = '';
  esError = false;
  errorFormulario = '';
  form: Producto = this.vacio();

  get filtrados(): Producto[] {
    const texto = this.q.toLowerCase().trim();
    return this.lista.filter(p => `${p.nombre} ${p.descripcion || ''}`.toLowerCase().includes(texto));
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.api.productos().subscribe({
      next: productos => this.lista = productos,
      error: error => this.mostrarError(error, 'No se pudieron cargar los productos.')
    });
  }

  nuevo(): void {
    this.form = this.vacio();
    this.errorFormulario = '';
    this.abierto = true;
  }

  editar(producto: Producto): void {
    this.form = { ...producto };
    this.errorFormulario = '';
    this.abierto = true;
  }

  guardar(): void {
    this.errorFormulario = '';
    if (!this.form.nombre.trim()) {
      this.errorFormulario = 'Ingrese el nombre del producto.';
      return;
    }
    if (this.form.precio == null || this.form.precio < 0 || this.form.stock == null || this.form.stock < 0) {
      this.errorFormulario = 'Precio y stock deben ser valores válidos no negativos.';
      return;
    }

    this.procesando = true;
    const operacion = this.form.id
      ? this.api.actualizarProducto(this.form)
      : this.api.crearProducto(this.form);
    operacion.subscribe({
      next: () => {
        this.procesando = false;
        this.abierto = false;
        this.mostrarMensaje('Producto guardado correctamente.');
        this.cargar();
      },
      error: error => {
        this.procesando = false;
        this.errorFormulario = this.extraerMensaje(error, 'No se pudo guardar el producto.');
      }
    });
  }

  eliminar(producto: Producto): void {
    if (!producto.id || !confirm(`¿Eliminar ${producto.nombre}?`)) return;
    this.api.eliminarProducto(producto.id).subscribe({
      next: () => { this.mostrarMensaje('Producto eliminado.'); this.cargar(); },
      error: error => this.mostrarError(error, 'No se pudo eliminar el producto.')
    });
  }

  trackById(_: number, item: Producto): number | undefined { return item.id; }

  private vacio(): Producto { return { nombre: '', descripcion: '', precio: 0, stock: 0, activo: true }; }
  private mostrarMensaje(mensaje: string): void { this.mensaje = mensaje; this.esError = false; }
  private mostrarError(error: HttpErrorResponse, fallback: string): void {
    this.mensaje = this.extraerMensaje(error, fallback); this.esError = true;
  }
  private extraerMensaje(error: HttpErrorResponse, fallback: string): string {
    return (error.error as ApiError)?.message || (error.status === 0 ? 'No hay conexión con el backend.' : fallback);
  }
}
