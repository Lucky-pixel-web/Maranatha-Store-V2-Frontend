# Maranatha Store V2 — Frontend Angular

Frontend Angular 18 enlazado con el API Gateway del backend.

## Requisitos

- Node.js 20 o 22.
- Backend funcionando en `http://localhost:8080`.

## Ejecutar en Visual Studio Code

Abra una terminal en esta carpeta y ejecute:

```powershell
npm install
npm start
```

Abra <http://localhost:4200>.

Credenciales iniciales:

- Usuario: `admin`
- Contraseña: `admin123`

El comando `npm start` usa `proxy.conf.json`; todas las llamadas `/api` se redirigen al Gateway `http://localhost:8080`.

## Compilar

```powershell
npm run build
```

## Funciones

- Inicio y cierre de sesión con expiración de JWT.
- Productos persistidos, edición, eliminación, búsqueda y alertas de stock bajo.
- Clientes con DNI, RUC o CE.
- Venta con carrito, validación de stock y selección de comprobante.
- Impresión de boleta, factura o nota de pedido.
- Historial y anulación con reposición del stock.
- Reportes Excel de inventario, clientes, ventas y detalles.

La factura mostrada es un comprobante interno. La integración electrónica con SUNAT requiere credenciales y certificado digital propios de la empresa.
