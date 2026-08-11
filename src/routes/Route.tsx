import { createBrowserRouter } from "react-router-dom";

import { GuestRoute } from "@/components/GuestRoute";
import { MainLayout } from "@/components/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { Inicio } from "@/pages/Inicio";
import { Usuarios } from "@/pages/Usuarios";
import { Clientes } from "@/pages/Clientes";
import { Existencias } from "@/pages/Existencias";
import { Venta } from "@/pages/Venta";
import { Compra } from "@/pages/Compra";
import { Cotizacion } from "@/pages/Cotizacion";
import { Recepciones } from "@/pages/Recepciones";
import { Devoluciones } from "@/pages/Devoluciones";
import { Apertura_cierre } from "@/pages/Apertura_cierre";
import { Historial_caja } from "@/pages/Historial_caja";
import { Reporte_ventas } from "@/pages/Reporte_ventas";
import { Reporte_cotizaciones } from "@/pages/Reporte_cotizaciones";
import { Kardex_inventario } from "@/pages/Kardex_inventario";
import { Productos } from "@/pages/Productos";
import { Servicios } from "@/pages/Servicios";
import { Categorias } from "@/pages/Categorias";
import { Proveedores } from "@/pages/Proveedores";
import { Datos_empresa } from "@/pages/Datos_empresa";
import { Backup } from "@/pages/Backup";

const pages = [
  { path: "inicio", element: <Inicio /> },
  { path: "usuarios", element: <Usuarios /> },
  { path: "clientes", element: <Clientes /> },
  { path: "existencias", element: <Existencias /> },
  { path: "venta", element: <Venta /> },
  { path: "compra", element: <Compra /> },
  { path: "cotizacion", element: <Cotizacion /> },
  { path: "recepciones", element: <Recepciones /> },
  { path: "devoluciones", element: <Devoluciones /> },
  { path: "apertura-cierre", element: <Apertura_cierre /> },
  { path: "historial-caja", element: <Historial_caja /> },
  { path: "reporte-ventas", element: <Reporte_ventas /> },
  { path: "reporte-cotizaciones", element: <Reporte_cotizaciones /> },
  { path: "kardex-inventario", element: <Kardex_inventario /> },
  { path: "productos", element: <Productos /> },
  { path: "servicios", element: <Servicios /> },
  { path: "categorias", element: <Categorias /> },
  { path: "proveedores", element: <Proveedores /> },
  { path: "datos-empresa", element: <Datos_empresa /> },
  { path: "backup", element: <Backup /> },
];

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <GuestRoute />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Inicio />,
          },
          ...pages,
        ],
      },
    ],
  },
]);
