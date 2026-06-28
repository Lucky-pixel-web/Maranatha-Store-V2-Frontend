import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, CrearVentaRequest, Producto, Venta } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  productos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.base}/productos`);
  }

  crearProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.base}/productos`, producto);
  }

  actualizarProducto(producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.base}/productos/${producto.id}`, producto);
  }

  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/productos/${id}`);
  }

  clientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.base}/clientes`);
  }

  crearCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.base}/clientes`, cliente);
  }

  actualizarCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.base}/clientes/${cliente.id}`, cliente);
  }

  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clientes/${id}`);
  }

  ventas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.base}/ventas`);
  }

  obtenerVenta(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.base}/ventas/${id}`);
  }

  crearVenta(venta: CrearVentaRequest): Observable<Venta> {
    return this.http.post<Venta>(`${this.base}/ventas`, venta);
  }

  anularVenta(id: number): Observable<Venta> {
    return this.http.put<Venta>(`${this.base}/ventas/${id}/anular`, {});
  }

  buscarDni(dni: string): Observable<{ numeroDocumento: string; nombres: string; apellidoPaterno: string; apellidoMaterno: string; estado?: string }> {
    return this.http.get<{ numeroDocumento: string; nombres: string; apellidoPaterno: string; apellidoMaterno: string; estado?: string }>(
      `/external/dni?numero=${dni}`
    );
  }

  buscarRuc(ruc: string): Observable<{ numeroDocumento: string; tipoDocumento: string; nombre: string; nombreComercial?: string; condicion?: string; estado?: string }> {
    return this.http.get<{ numeroDocumento: string; tipoDocumento: string; nombre: string; nombreComercial?: string; condicion?: string; estado?: string }>(
      `/external/ruc?numero=${ruc}`
    );
  }

  login(username: string, password: string) {
    return this.http.post<{ token: string; username: string; rol: string }>(
      `${this.base}/auth/login`,
      { username, password }
    );
  }
}
