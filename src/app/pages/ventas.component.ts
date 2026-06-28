import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ApiError, Cliente, DetalleVenta, Producto, TipoComprobante, Venta } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-title no-print">
      <div><h2>Venta y facturación</h2><p>Boleta, factura o nota de pedido con control automático de stock</p></div>
      <button class="secondary" (click)="nuevoComprobante()">Nueva venta</button>
    </div>
    <div *ngIf="mensaje" class="notice no-print" [class.error-notice]="esError">{{ mensaje }}</div>

    <div class="sale-grid">
      <section class="panel no-print">
        <h3>Datos del comprobante</h3>
        <div class="row">
          <label>Tipo
            <select [(ngModel)]="tipo" (ngModelChange)="onTipoChange()">
              <option value="BOLETA">Boleta</option>
              <option value="FACTURA">Factura</option>
              <option value="NOTA_PEDIDO">Nota de pedido</option>
            </select>
          </label>
          <label>Cliente
            <select [(ngModel)]="clienteId" (ngModelChange)="ventaEmitida=undefined">
              <option [ngValue]="undefined">Público general</option>
              <option *ngFor="let c of clientes" [ngValue]="c.id">{{ c.nombre }} {{ c.apellido }} · {{ c.numeroDocumento || 'sin documento' }}</option>
            </select>
          </label>
        </div>
        <div *ngIf="tipo==='BOLETA' || tipo==='FACTURA'" class="row">
          <label>{{ tipo === 'BOLETA' ? 'DNI' : 'RUC' }}
            <input type="text" [(ngModel)]="documento" name="documento" [attr.maxlength]="tipo === 'BOLETA' ? 8 : 11" placeholder="{{ tipo === 'BOLETA' ? 'Ingrese DNI' : 'Ingrese RUC' }}">
          </label>
        </div>
        <small class="hint" *ngIf="documentoNombre">{{ documentoNombre }}</small>
        <small class="error" *ngIf="documentoError">{{ documentoError }}</small>
        <small class="warning" *ngIf="tipo==='FACTURA'">La factura exige un cliente con RUC válido de 11 dígitos.</small>

        <div class="row product-row product-search-row">
          <label>Producto
            <input type="text" [(ngModel)]="productoFiltro" (ngModelChange)="onProductoFiltroChange()" placeholder="Ingrese las primeras letras del producto" autocomplete="off">
            <div class="suggestions" *ngIf="productoFiltro">
              <div *ngFor="let p of productosFiltrados" class="suggestion" [class.selected]="productoId === p.id" [class.disabled]="p.stock===0" (click)="p.stock > 0 && seleccionarProducto(p.id)">
                {{ p.nombre }} — S/ {{ p.precio | number:'1.2-2' }} — stock {{ p.stock }}
              </div>
              <div *ngIf="!productosFiltrados.length" class="hint">No se encontró producto.</div>
            </div>
          </label>
        </div>
        <div class="row product-row">
          <label>Cantidad<input type="number" min="1" step="1" [(ngModel)]="cantidad"></label>
          <button (click)="agregar()" [disabled]="!productoId">Agregar al carrito</button>
        </div>

        <div class="table-wrap mini">
          <table>
            <thead><tr><th>Producto</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let d of detalles; let i=index">
                <td>{{ d.productoNombre }}</td>
                <td>{{ d.cantidad }}</td>
                <td>S/ {{ d.precioUnitario | number:'1.2-2' }}</td>
                <td>S/ {{ d.subtotal | number:'1.2-2' }}</td>
                <td><button class="link danger-text" (click)="quitar(i)">Quitar</button></td>
              </tr>
              <tr *ngIf="!detalles.length"><td colspan="5" class="empty">Agregue productos para registrar la venta.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="total"><span>Total</span><strong>S/ {{ totalBorrador | number:'1.2-2' }}</strong></div>
        <button class="primary-wide" [disabled]="!detalles.length || procesando" (click)="registrar()">
          {{ procesando ? 'Registrando...' : 'Registrar e imprimir' }}
        </button>
      </section>

      <section class="panel receipt" id="comprobante">
        <div class="receipt-head">
          <h2>MARANATHA STORE</h2>
          <p>Librería escolar</p>
          <small>RUC: 20XXXXXXXXX · Tacna, Perú</small>
        </div>
        <hr>
        <p>
          <b>{{ comprobanteTipo }}</b><br>
          <span *ngIf="ventaEmitida">N.° {{ ventaEmitida.serie }}-{{ ventaEmitida.numero }}<br></span>
          Fecha: {{ comprobanteFecha | date:'dd/MM/yyyy HH:mm' }}<br>
          Estado: {{ ventaEmitida?.estado || 'BORRADOR' }}
        </p>
        <p>Cliente: {{ comprobanteCliente }}<br><small *ngIf="comprobanteDocumento">{{ comprobanteDocumento }}</small></p>
        <table>
          <tr *ngFor="let d of comprobanteDetalles">
            <td>{{ d.cantidad }} x {{ d.productoNombre }}</td>
            <td>S/ {{ d.subtotal | number:'1.2-2' }}</td>
          </tr>
        </table>
        <hr>
        <div class="total"><span>TOTAL</span><strong>S/ {{ comprobanteTotal | number:'1.2-2' }}</strong></div>
        <small>Gracias por su compra</small>
      </section>
    </div>

    <section class="panel history no-print">
      <div class="history-title"><div><h3>Comprobantes emitidos</h3><p>Las ventas anuladas conservan el historial y reponen el stock.</p></div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Comprobante</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let v of ventas">
              <td><b>{{ v.serie }}-{{ v.numero }}</b><br><small>{{ textoTipo(v.tipoComprobante) }}</small></td>
              <td>{{ v.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ v.clienteNombre }}</td>
              <td>S/ {{ v.total | number:'1.2-2' }}</td>
              <td><span class="status" [class.danger]="v.estado==='ANULADA'">{{ v.estado }}</span></td>
              <td>
                <button class="link" (click)="reimprimir(v)">Imprimir</button>
                <button *ngIf="v.estado==='EMITIDA'" class="link danger-text" (click)="anular(v)">Anular</button>
              </td>
            </tr>
            <tr *ngIf="!ventas.length"><td colspan="6" class="empty">Todavía no hay ventas registradas.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class VentasComponent implements OnInit {
  private readonly api = inject(ApiService);
  productos: Producto[] = [];
  clientes: Cliente[] = [];
  ventas: Venta[] = [];
  tipo: TipoComprobante = 'BOLETA';
  clienteId?: number;
  productoId?: number;
  cantidad = 1;
  documento = '';
  documentoNombre = '';
  documentoError = '';
  documentoBuscando = false;
  documentoValido = false;
  productoFiltro = '';
  detalles: DetalleVenta[] = [];
  ventaEmitida?: Venta;
  procesando = false;
  mensaje = '';
  esError = false;

  get totalBorrador(): number {
    return this.detalles.reduce((suma, detalle) => suma + (detalle.subtotal || 0), 0);
  }

  get clienteSeleccionado(): string {
    const cliente = this.clientes.find(item => item.id === this.clienteId);
    return cliente ? `${cliente.nombre} ${cliente.apellido || ''}`.trim() : 'Público general';
  }

  get comprobanteDetalles(): DetalleVenta[] {
    return this.ventaEmitida?.detalles || this.detalles;
  }

  get comprobanteTotal(): number {
    return this.ventaEmitida?.total ?? this.totalBorrador;
  }

  get comprobanteCliente(): string {
    return this.ventaEmitida?.clienteNombre || this.clienteSeleccionado;
  }

  get comprobanteDocumento(): string {
    if (this.ventaEmitida?.clienteDocumento) return this.ventaEmitida.clienteDocumento;
    const cliente = this.clientes.find(item => item.id === this.clienteId);
    if (cliente?.numeroDocumento) return `${cliente.tipoDocumento} ${cliente.numeroDocumento}`;
    if (this.documento) return `${this.tipo === 'BOLETA' ? 'DNI' : 'RUC'} ${this.documento}`;
    return '';
  }

  get productosFiltrados(): Producto[] {
    const filtro = this.productoFiltro.trim().toLowerCase();
    return filtro
      ? this.productos.filter(item => item.nombre.toLowerCase().includes(filtro))
      : this.productos;
  }

  get productoSeleccionadoNombre(): string {
    const producto = this.productos.find(p => p.id === this.productoId);
    return producto ? producto.nombre : 'Ninguno';
  }

  get comprobanteFecha(): Date | string {
    return this.ventaEmitida?.fecha || new Date();
  }

  get comprobanteTipo(): string {
    return this.textoTipo(this.ventaEmitida?.tipoComprobante || this.tipo);
  }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarVentas();
  }

  onTipoChange(): void {
    this.ventaEmitida = undefined;
    this.documento = '';
    this.documentoNombre = '';
    this.documentoError = '';
    this.documentoValido = false;
  }

  onDocumentoChange(): void {
    this.documentoNombre = '';
    this.documentoError = '';
    this.documentoValido = false;
  }

  onProductoFiltroChange(): void {
    this.productoId = undefined;
  }

  seleccionarProducto(id?: number): void {
    this.productoId = id;
    this.mensaje = '';
    this.productoFiltro = this.productos.find(p => p.id === id)?.nombre || '';
  }

  buscarDocumento(): void {
    this.documentoError = '';
    this.documentoNombre = '';
    this.documentoValido = false;

    const numero = this.documento.trim();
    if (this.tipo === 'BOLETA') {
      if (!/^[0-9]{8}$/.test(numero)) {
        this.documentoError = 'El DNI debe tener 8 dígitos válidos.';
        return;
      }
      this.documentoBuscando = true;
      this.api.buscarDni(numero).subscribe({
        next: data => {
          this.documentoBuscando = false;
          this.documentoValido = true;
          this.documentoNombre = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim();
        },
        error: err => {
          this.documentoBuscando = false;
          const status = err?.status ?? 0;
          const message = err?.message ? ` ${err.message}` : '';
          this.documentoError = status === 0
            ? 'Error de conexión o proxy. Reinicie el servidor de desarrollo y verifique la configuración de proxy.'
            : `No se encontró el DNI. Verifique el número e intente nuevamente. (HTTP ${status})${message}`;
        }
      });
      return;
    }

    if (this.tipo === 'FACTURA') {
      if (!/^[0-9]{11}$/.test(numero)) {
        this.documentoError = 'El RUC debe tener 11 dígitos válidos.';
        return;
      }
      this.documentoBuscando = true;
      this.api.buscarRuc(numero).subscribe({
        next: data => {
          this.documentoBuscando = false;
          this.documentoValido = true;
          this.documentoNombre = data.nombreComercial?.trim() || data.nombre?.trim() || 'RUC válido';
        },
        error: err => {
          this.documentoBuscando = false;
          const status = err?.status ?? 0;
          const message = err?.message ? ` ${err.message}` : '';
          this.documentoError = status === 0
            ? 'Error de conexión o proxy. Reinicie el servidor de desarrollo y verifique la configuración de proxy.'
            : `No se encontró el RUC. Verifique el número e intente nuevamente. (HTTP ${status})${message}`;
        }
      });
      return;
    }
  }

  cargarCatalogos(): void {
    forkJoin([this.api.productos(), this.api.clientes()]).subscribe({
      next: ([productos, clientes]) => {
        this.productos = productos.filter(item => item.activo !== false);
        this.clientes = clientes.filter(item => item.activo !== false);
        if (!this.productos.some(item => item.id === this.productoId)) {
          this.productoId = this.productos.find(item => item.stock > 0)?.id;
        }
      },
      error: error => this.mostrarError(error, 'No se pudieron cargar productos y clientes.')
    });
  }

  cargarVentas(): void {
    this.api.ventas().subscribe({
      next: ventas => this.ventas = ventas,
      error: error => this.mostrarError(error, 'No se pudo cargar el historial de ventas.')
    });
  }

  agregar(): void {
    this.ventaEmitida = undefined;
    const producto = this.productos.find(item => item.id === this.productoId);
    const cantidad = Number(this.cantidad);
    if (!producto || !Number.isInteger(cantidad) || cantidad < 1) {
      this.mostrarErrorSimple('Seleccione un producto e ingrese una cantidad válida.');
      return;
    }
    const existente = this.detalles.find(item => item.productoId === producto.id);
    const cantidadTotal = cantidad + (existente?.cantidad || 0);
    if (cantidadTotal > producto.stock) {
      this.mostrarErrorSimple(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`);
      return;
    }

    if (existente) {
      existente.cantidad = cantidadTotal;
      existente.subtotal = cantidadTotal * (existente.precioUnitario || 0);
    } else {
      this.detalles.push({
        productoId: producto.id!,
        productoNombre: producto.nombre,
        cantidad,
        precioUnitario: producto.precio,
        subtotal: producto.precio * cantidad
      });
    }
    this.cantidad = 1;
    this.productoId = undefined;
    this.productoFiltro = '';
    this.mensaje = '';
  }

  quitar(indice: number): void {
    this.detalles.splice(indice, 1);
    this.ventaEmitida = undefined;
  }

  registrar(): void {
    if (!this.detalles.length) return;
    // Para esta versión provisional, el documento se puede ingresar manualmente así no se valide.

    this.procesando = true;
    this.mensaje = '';
    this.api.crearVenta({
      clienteId: this.clienteId,
      tipoComprobante: this.tipo,
      detalles: this.detalles.map(item => ({ productoId: item.productoId, cantidad: item.cantidad }))
    }).subscribe({
      next: venta => {
        this.procesando = false;
        this.ventaEmitida = venta;
        this.detalles = [];
        this.mensaje = `Venta registrada: ${venta.serie}-${venta.numero}. El stock fue actualizado.`;
        this.esError = false;
        this.cargarCatalogos();
        this.cargarVentas();
        setTimeout(() => window.print(), 150);
      },
      error: error => {
        this.procesando = false;
        this.mostrarError(error, 'No se pudo registrar la venta.');
      }
    });
  }

  anular(venta: Venta): void {
    if (!confirm(`¿Anular ${venta.serie}-${venta.numero}? El stock será repuesto.`)) return;
    this.api.anularVenta(venta.id).subscribe({
      next: anulada => {
        this.ventaEmitida = anulada;
        this.mensaje = `Venta ${anulada.serie}-${anulada.numero} anulada y stock repuesto.`;
        this.esError = false;
        this.cargarCatalogos();
        this.cargarVentas();
      },
      error: error => this.mostrarError(error, 'No se pudo anular la venta.')
    });
  }

  reimprimir(venta: Venta): void {
    this.ventaEmitida = venta;
    setTimeout(() => window.print(), 100);
  }

  nuevoComprobante(): void {
    this.ventaEmitida = undefined;
    this.detalles = [];
    this.tipo = 'BOLETA';
    this.clienteId = undefined;
    this.cantidad = 1;
    this.mensaje = '';
  }

  textoTipo(tipo: TipoComprobante): string {
    return tipo.replace('_', ' ');
  }

  private mostrarError(error: HttpErrorResponse, fallback: string): void {
    this.mensaje = (error.error as ApiError)?.message
      || (error.status === 0 ? 'No hay conexión con el backend.' : fallback);
    this.esError = true;
  }

  private mostrarErrorSimple(mensaje: string): void {
    this.mensaje = mensaje;
    this.esError = true;
  }
}
