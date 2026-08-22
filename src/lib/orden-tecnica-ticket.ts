import { formatDateTime } from "@/lib/format-date"
import type { EmpresaConfig } from "@/types/empresa"
import type { OrdenTecnica } from "@/types/ordenTecnica"

function escapeHtml(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function money(value: number | null | undefined): string {
  return `Bs. ${(value ?? 0).toFixed(2)}`
}

function lineItemRow(left: string, right: string): string {
  return `<div class="row"><span class="left">${left}</span><span class="right">${right}</span></div>`
}

function ticketStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #f4f4f5;
      display: flex;
      justify-content: center;
      padding: 12px;
    }
    .ticket {
      width: 100%;
      max-width: 80mm;
      background: #fff;
      padding: 12px 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
    .muted { color: #555; font-size: 10px; }
    .empresa-nombre {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.02em;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .doc-titulo {
      font-size: 12px;
      font-weight: 800;
      margin: 6px 0 2px 0;
      text-transform: uppercase;
    }
    .sep {
      border: none;
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .section-title {
      font-weight: 700;
      font-size: 10.5px;
      margin-bottom: 4px;
      text-transform: uppercase;
      border-bottom: 1px dotted #888;
      padding-bottom: 2px;
    }
    .info-block {
      margin-bottom: 6px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 4px;
      margin-bottom: 2px;
    }
    .item {
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px dotted #ccc;
    }
    .item:last-child {
      border-bottom: none;
    }
    .item-name {
      font-weight: 600;
    }
    .totals {
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px dashed #000;
    }
    .badge {
      display: inline-block;
      padding: 1px 6px;
      font-size: 9.5px;
      font-weight: 700;
      border-radius: 3px;
      border: 1px solid #000;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 10px;
      font-size: 9px;
      color: #444;
      text-align: center;
      line-height: 1.3;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .ticket {
        max-width: 100%;
        width: 80mm;
        box-shadow: none;
        padding: 4px 6px;
      }
    }
  `
}

/**
 * Genera HTML de comprobante de Orden Técnica para impresoras de rollo (80mm).
 */
export function buildOrdenTecnicaTicketHtml(
  orden: OrdenTecnica,
  empresa: EmpresaConfig | null
): string {
  const nombreEmpresa = escapeHtml(empresa?.nombreEmpresa || "Empresa")
  const telefono = escapeHtml(empresa?.telefono)
  const email = escapeHtml(empresa?.email)
  const direccion = escapeHtml(empresa?.direccion)
  const sitioWeb = escapeHtml(empresa?.sitioWeb)

  const codigo = escapeHtml(orden.codigoOrden)
  const fecha = orden.fechaHoraIngreso ? formatDateTime(orden.fechaHoraIngreso) : "N/A"
  const clienteNombre = escapeHtml(orden.clienteNombre || "Cliente General")
  const clienteCi = escapeHtml(orden.clienteCi || "N/A")
  const tecnicoNombre = escapeHtml(orden.tecnicoNombre || "Sin Asignar")
  const estado = escapeHtml(orden.estado)
  const diagnostico = escapeHtml(orden.diagnostico)
  const observaciones = escapeHtml(orden.observaciones)

  const componentes = orden.componentes ?? []
  const servicios = orden.servicios ?? []

  const totalServicios = servicios.reduce((acc, s) => acc + (s.precioAplicado || 0), 0)

  const componentesRows = componentes
    .map((c) => {
      const nombre = escapeHtml(c.productoNombre)
      const sku = c.sku ? `<span class="muted"> (SKU: ${escapeHtml(c.sku)})</span>` : ""
      const serie = c.numeroSerie ? `<div class="muted">N° Serie: ${escapeHtml(c.numeroSerie)}</div>` : ""

      return `
        <div class="item">
          <div class="item-name">${nombre}${sku}</div>
          ${serie}
          <div class="row">
            <span>Cantidad: ${c.cantidad} un.</span>
          </div>
        </div>`
    })
    .join("")

  const serviciosRows = servicios
    .map((s) => {
      const nombre = escapeHtml(s.servicioNombre)
      return `
        <div class="item">
          <div class="item-name">${nombre}</div>
          <div class="row">
            <span>Mano de Obra</span>
            <span class="right font-bold">${money(s.precioAplicado)}</span>
          </div>
        </div>`
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orden Técnica ${codigo}</title>
  <style>${ticketStyles()}</style>
</head>
<body>
  <div class="ticket">
    <div class="center">
      <div class="empresa-nombre">${nombreEmpresa}</div>
      ${direccion ? `<div class="muted">${direccion}</div>` : ""}
      ${telefono ? `<div class="muted">Tel: ${telefono}</div>` : ""}
      ${email ? `<div class="muted">${email}</div>` : ""}
      ${sitioWeb ? `<div class="muted">${sitioWeb}</div>` : ""}
    </div>

    <hr class="sep" />

    <div class="center">
      <div class="doc-titulo">ORDEN DE SERVICIO TÉCNICO</div>
      <div class="bold" style="font-size: 13px;">N° ${codigo}</div>
      <div style="margin-top: 4px;"><span class="badge">${estado}</span></div>
    </div>

    <hr class="sep" />

    <div class="info-block">
      ${lineItemRow("Fecha Ingreso:", fecha)}
      ${lineItemRow("Cliente:", clienteNombre)}
      ${lineItemRow("NIT / CI:", clienteCi)}
      ${lineItemRow("Técnico Resp.:", tecnicoNombre)}
    </div>

    ${
      diagnostico || observaciones
        ? `
      <hr class="sep" />
      <div class="info-block">
        ${diagnostico ? `<div class="section-title">Falla / Diagnóstico</div><div class="muted" style="margin-bottom: 4px; white-space: pre-wrap;">${diagnostico}</div>` : ""}
        ${observaciones ? `<div class="section-title">Observaciones / Accesorios</div><div class="muted" style="white-space: pre-wrap;">${observaciones}</div>` : ""}
      </div>`
        : ""
    }

    ${
      componentes.length > 0
        ? `
      <hr class="sep" />
      <div class="section-title">Repuestos / Componentes</div>
      ${componentesRows}`
        : ""
    }

    ${
      servicios.length > 0
        ? `
      <hr class="sep" />
      <div class="section-title">Servicios Técnicos</div>
      ${serviciosRows}`
        : ""
    }

    <div class="totals">
      ${lineItemRow("Total Servicios:", money(totalServicios))}
      ${
        orden.montoTotalCobrado != null && orden.montoTotalCobrado > 0
          ? lineItemRow("Total Cobrado POS:", money(orden.montoTotalCobrado))
          : ""
      }
      ${
        orden.metodoPagoVenta
          ? lineItemRow("Método de Pago:", escapeHtml(orden.metodoPagoVenta))
          : ""
      }
    </div>

    <hr class="sep" />

    <div class="footer">
      <div>Comprobante de recepción de equipo técnico.</div>
      <div style="margin-top: 4px; font-weight: 600;">Conserve este documento para el retiro o reclamo de su equipo.</div>
    </div>
  </div>
</body>
</html>`
}
