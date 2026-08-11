import { Link, useLocation } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routes: Record<
  string,
  {
    title: string;
    parent?: string;
  }
> = {
  "/inicio": {
    title: "Inicio",
  },
  "/usuarios": {
    title: "Usuarios",
    parent: "Directorios",
  },
  "/clientes": {
    title: "Clientes",
    parent: "Directorios",
  },
  "/existencias": {
    title: "Existencias",
    parent: "Operaciones",
  },
  "/venta": {
    title: "Venta",
    parent: "Operaciones",
  },
  "/compra": {
    title: "Compra",
    parent: "Operaciones",
  },
  "/cotizacion": {
    title: "Cotizacion",
    parent: "Operaciones",
  },
  "/recepciones": {
    title: "Recepciones",
    parent: "Operaciones",
  },
  "/devoluciones": {
    title: "Devoluciones",
    parent: "Operaciones",
  },
  "/apertura-cierre": {
    title: "Apertura/Cierre",
    parent: "Caja",
  },
  "/historial-caja": {
    title: "Historial Caja",
    parent: "Caja",
  },
  "/reporte-ventas": {
    title: "Reporte de Ventas",
    parent: "Analisis y Reportes",
  },
  "/reporte-cotizaciones": {
    title: "Reporte de Cotizaciones",
    parent: "Analisis y Reportes",
  },
  "/kardex-inventario": {
    title: "Kardex de Inventario",
    parent: "Analisis y Reportes",
  },
  "/productos": {
    title: "Productos",
    parent: "Mantenimiento",
  },
  "/servicios": {
    title: "Servicios",
    parent: "Mantenimiento",
  },
  "/categorias": {
    title: "Categorías",
    parent: "Mantenimiento",
  },
  "/proveedores": {
    title: "Proveedores",
    parent: "Mantenimiento",
  },
  "/datos-empresa": {
    title: "Datos de Empresa",
    parent: "Configuración",
  },
  "/backup": {
    title: "Backup",
    parent: "Configuración",
  },
};

export function Breadcrumbs() {
  const { pathname } = useLocation();

  const current = routes[pathname];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {pathname === "/inicio" || pathname === "/" ? (
            <BreadcrumbPage>Inicio</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link to="/inicio" />}>
              Inicio
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {current?.parent && (
          <>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{current.parent}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {pathname !== "/inicio" && pathname !== "/" && current && (
          <>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{current.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
