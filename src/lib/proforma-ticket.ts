import { formatDateTime } from "@/lib/format-date"
import type { Cotizacion } from "@/types/cotizacion"
import type { EmpresaConfig } from "@/types/empresa"

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

function lineItemRow(left: string, right: string, extraClass = ""): string {
  return `<div class="row ${extraClass}"><span class="left">${left}</span><span class="right">${right}</span></div>`
}

function ticketStyles(): string {
  return `
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: "Courier New", Courier, monospace;
      font-size: 12px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ticket {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 4mm 3mm 8mm;
    }
    .center { text-align: center; }
    .empresa-nombre {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .muted { color: #333; font-size: 11px; }
    .sep {
      border: none;
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .sep-solid {
      border: none;
      border-top: 1px solid #000;
      margin: 8px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: flex-start;
    }
    .left { flex: 1; min-width: 0; word-break: break-word; }
    .right { flex-shrink: 0; text-align: right; white-space: nowrap; }
    .item { margin-bottom: 8px; }
    .item-name { font-weight: 700; word-break: break-word; }
    .total-row {
      font-size: 14px;
      font-weight: 700;
      margin-top: 4px;
    }
    .pie {
      margin-top: 10px;
      text-align: center;
      font-size: 10px;
      word-break: break-word;
    }
    .meta { margin: 2px 0; }
    @media screen {
      body { background: #f3f4f6; padding: 16px 0; }
      .ticket {
        background: #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,.12);
      }
    }
  `
}

/**
 * Genera HTML de proforma para impresoras de rollo (80mm).
 */
export function buildProformaTicketHtml(
  cotizacion: Cotizacion,
  empresa: EmpresaConfig | null
): string {
  const nombreEmpresa = escapeHtml(empresa?.nombreEmpresa || "Empresa")
  const nit = escapeHtml(empresa?.nit)
  const telefono = escapeHtml(empresa?.telefono)
  const email = escapeHtml(empresa?.email)
  const direccion = escapeHtml(empresa?.direccion)
  const sitioWeb = escapeHtml(empresa?.sitioWeb)
  const pie = escapeHtml(
    empresa?.pieNotaVenta ||
      "Proforma comercial. Los precios y disponibilidad están sujetos a confirmación."
  )

  const productos = cotizacion.productos ?? []
  const servicios = cotizacion.servicios ?? []

  const productRows = productos
    .map((p) => {
      const nombre = escapeHtml(p.productoNombre || `Producto ${p.productoId.slice(0, 8)}`)
      const sku = p.sku ? `<div class="muted">SKU: ${escapeHtml(p.sku)}</div>` : ""
      const serie = p.numeroSerie
        ? `<div class="muted">Serie: ${escapeHtml(p.numeroSerie)}</div>`
        : ""
      const desc =
        p.valorDescuento && p.valorDescuento > 0
          ? `<div class="muted">Desc. ${escapeHtml(p.tipoDescuento || "Fijo")}: -${money(p.valorDescuento)}</div>`
          : ""

      const unit = p.precioUnitario
      const subtotal =
        p.subtotalNeto ??
        (unit != null ? Math.max(0, unit * p.cantidad - (p.valorDescuento || 0)) : null)

      return `
        <div class="item">
          <div class="item-name">${nombre}</div>
          ${sku}${serie}${desc}
          <div class="row">
            <span>${p.cantidad}${unit != null ? ` x ${money(unit)}` : " ud."}</span>
            <span class="right">${subtotal != null ? money(subtotal) : ""}</span>
          </div>
        </div>`
    })
    .join("")

  const serviceRows = servicios
    .map((s) => {
      const nombre = escapeHtml(s.servicioNombre || `Servicio ${s.servicioId.slice(0, 8)}`)
      const desc =
        s.valorDescuento && s.valorDescuento > 0
          ? `<div class="muted">Desc. ${escapeHtml(s.tipoDescuento || "Fijo")}: -${money(s.valorDescuento)}</div>`
          : ""
      const subtotal =
        s.subtotalNeto ?? Math.max(0, s.precioFinalAplicado - (s.valorDescuento || 0))

      return `
        <div class="item">
          <div class="item-name">${nombre}</div>
          <div class="muted">Servicio</div>
          ${desc}
          <div class="row">
            <span>1 x ${money(s.precioFinalAplicado)}</span>
            <span class="right">${money(subtotal)}</span>
          </div>
        </div>`
    })
    .join("")

  const itemsBlock =
    productRows + serviceRows ||
    `<div class="muted center">Sin detalle de ítems</div>`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Proforma ${escapeHtml(cotizacion.codigoProforma)}</title>
  <style>${ticketStyles()}</style>
</head>
<body>
  <div class="ticket">
    <div class="center">
      <div class="empresa-nombre">${nombreEmpresa}</div>
      ${nit ? `<div class="muted">NIT: ${nit}</div>` : ""}
      ${direccion ? `<div class="muted">${direccion}</div>` : ""}
      ${telefono ? `<div class="muted">Tel: ${telefono}</div>` : ""}
      ${email ? `<div class="muted">${email}</div>` : ""}
      ${sitioWeb ? `<div class="muted">${sitioWeb}</div>` : ""}
    </div>

    <hr class="sep" />

    <div class="center" style="font-weight:700">PROFORMA</div>
    <div class="center meta">${escapeHtml(cotizacion.codigoProforma)}</div>
    <div class="center muted">${escapeHtml(formatDateTime(cotizacion.fechaHora))}</div>

    <hr class="sep" />

    <div class="meta">Cliente: ${escapeHtml(cotizacion.clienteNombre || "Cliente Genérico")}</div>
    ${cotizacion.clienteCi ? `<div class="meta muted">CI/NIT: ${escapeHtml(cotizacion.clienteCi)}</div>` : ""}
    <div class="meta">Validez: ${cotizacion.diasValidez} día(s)</div>
    <div class="meta">Estado: ${escapeHtml(cotizacion.estado)}</div>

    <hr class="sep" />

    ${itemsBlock}

    <hr class="sep-solid" />

    ${lineItemRow("TOTAL ESTIMADO", money(cotizacion.totalEstimado), "total-row")}

    <hr class="sep" />

    <div class="pie">${pie}</div>
    <div class="center muted" style="margin-top:8px">Documento no válido como factura</div>
  </div>
</body>
</html>`
}
