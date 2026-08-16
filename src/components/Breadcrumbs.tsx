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
  "/venta": {
    title: "Punto de Venta",
  },
  "/cotizacion": {
    title: "Cotización",
    parent: "Operaciones",
  },
  "/compra": {
    title: "Compras",
    parent: "Operaciones",
  },
  "/recepciones": {
    title: "Taller / Recepciones",
    parent: "Operaciones",
  },
  "/devoluciones": {
    title: "Devoluciones",
    parent: "Operaciones",
  },
  "/apertura-cierre": {
    title: "Apertura / Cierre",
    parent: "Caja",
  },
  "/historial-caja": {
    title: "Historial de Arqueos",
    parent: "Caja",
  },
  "/existencias": {
    title: "Existencias (Stock)",
    parent: "Inventario",
  },
  "/productos": {
    title: "Productos",
    parent: "Inventario",
  },
  "/categorias": {
    title: "Categorías",
    parent: "Inventario",
  },
  "/servicios": {
    title: "Servicios",
    parent: "Inventario",
  },
  "/clientes": {
    title: "Clientes",
    parent: "Contactos",
  },
  "/proveedores": {
    title: "Proveedores",
    parent: "Contactos",
  },
  "/reporte-ventas": {
    title: "Reporte de Ventas",
    parent: "Análisis y Reportes",
  },
  "/reporte-cotizaciones": {
    title: "Reporte de Cotizaciones",
    parent: "Análisis y Reportes",
  },
  "/kardex-inventario": {
    title: "Kardex y Mermas",
    parent: "Análisis y Reportes",
  },
  "/usuarios": {
    title: "Usuarios",
    parent: "Sistema",
  },
  "/datos-empresa": {
    title: "Datos de Empresa",
    parent: "Sistema",
  },
  "/backup": {
    title: "Auditoría & Backup",
    parent: "Sistema",
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
