import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { ApiService } from '../core/api.service';
import { Venta } from '../models';

@Component({
  standalone: true,
  template: `
    <div class="page-title"><div><h2>Reportes</h2><p>Exportación a Microsoft Excel</p></div></div>
    <div class="cards report-cards">
      <article><h3>Inventario</h3><p>Productos, precios, stock y estado.</p><button (click)="inventario()">Descargar Excel</button></article>
      <article><h3>Ventas</h3><p>Comprobantes y detalle de productos vendidos.</p><button (click)="reporteVentas()">Descargar Excel</button></article>
      <article><h3>Reporte integral</h3><p>Un archivo con productos, clientes, ventas y detalles.</p><button (click)="integral()">Descargar Excel</button></article>
    </div>
  `
})
export class ReportesComponent {
  private readonly api = inject(ApiService);

  inventario(): void {
    this.api.productos().subscribe(productos => this.guardar('reporte-inventario.xlsx', {
      Inventario: productos.map(item => ({
        ID: item.id, Producto: item.nombre, Descripción: item.descripcion,
        Precio: item.precio, Stock: item.stock,
        Estado: item.activo === false ? 'INACTIVO' : item.stock <= 5 ? 'STOCK BAJO' : 'DISPONIBLE'
      }))
    }));
  }

  reporteVentas(): void {
    this.api.ventas().subscribe(ventas => this.guardar('reporte-ventas.xlsx', this.hojasVentas(ventas)));
  }

  integral(): void {
    forkJoin([this.api.productos(), this.api.clientes(), this.api.ventas()]).subscribe(([productos, clientes, ventas]) => {
      this.guardar('reporte-integral-maranatha.xlsx', {
        Productos: productos,
        Clientes: clientes,
        ...this.hojasVentas(ventas)
      });
    });
  }

  private hojasVentas(ventas: Venta[]): Record<string, unknown[]> {
    return {
      Ventas: ventas.map(venta => ({
        ID: venta.id,
        Comprobante: `${venta.serie}-${venta.numero}`,
        Tipo: venta.tipoComprobante,
        Fecha: venta.fecha,
        Cliente: venta.clienteNombre,
        Documento: venta.clienteDocumento,
        Total: venta.total,
        Estado: venta.estado
      })),
      DetalleVentas: ventas.flatMap(venta => venta.detalles.map(detalle => ({
        VentaID: venta.id,
        Comprobante: `${venta.serie}-${venta.numero}`,
        ProductoID: detalle.productoId,
        Producto: detalle.productoNombre,
        Cantidad: detalle.cantidad,
        PrecioUnitario: detalle.precioUnitario,
        Subtotal: detalle.subtotal
      })))
    };
  }

  private guardar(nombre: string, hojas: Record<string, unknown[]>): void {
    const libro = XLSX.utils.book_new();
    Object.entries(hojas).forEach(([nombreHoja, datos]) => {
      XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datos), nombreHoja.substring(0, 31));
    });
    XLSX.writeFile(libro, nombre);
  }
}
