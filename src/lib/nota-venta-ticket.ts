import { formatDateTime } from "@/lib/format-date"
import type { EmpresaConfig } from "@/types/empresa"
import type { Venta } from "@/types/venta"

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

/**
 * Genera HTML de nota de venta para impresoras de rollo (80mm).
 */
export function buildNotaVentaTicketHtml(
  venta: Venta,
  empresa: EmpresaConfig | null
): string {
  const nombreEmpresa = escapeHtml(empresa?.nombreEmpresa || "Empresa")
  const telefono = escapeHtml(empresa?.telefono)
  const email = escapeHtml(empresa?.email)
  const direccion = escapeHtml(empresa?.direccion)
  const sitioWeb = escapeHtml(empresa?.sitioWeb)
  const pie = escapeHtml(
    empresa?.pieNotaVenta ||
      "Comprobante interno emitido por el sistema POS. Conserve este documento."
  )

  const productos = venta.productos ?? []
  const servicios = venta.servicios ?? []

  const productRows = productos
    .map((p) => {
      const nombre = escapeHtml(p.productoNombre)
      const sku = p.sku ? `<div class="muted">SKU: ${escapeHtml(p.sku)}</div>` : ""
      const serie = p.numeroSerie
        ? `<div class="muted">Serie: ${escapeHtml(p.numeroSerie)}</div>`
        : ""
      const desc =
        p.valorDescuento && p.valorDescuento > 0
          ? `<div class="muted">Desc. ${escapeHtml(p.tipoDescuento || "Fijo")}: -${money(p.valorDescuento)}</div>`
          : ""

      return `
        <div class="item">
          <div class="item-name">${nombre}</div>
          ${sku}${serie}${desc}
          <div class="row">
            <span>${p.cantidad} x ${money(p.precioUnitario)}</span>
            <span class="right">${money(p.subtotalNeto)}</span>
          </div>
        </div>`
    })
    .join("")

  const serviceRows = servicios
    .map((s) => {
      const nombre = escapeHtml(s.servicioNombre)
      const desc =
        s.valorDescuento && s.valorDescuento > 0
          ? `<div class="muted">Desc. ${escapeHtml(s.tipoDescuento || "Fijo")}: -${money(s.valorDescuento)}</div>`
          : ""

      return `
        <div class="item">
          <div class="item-name">${nombre}</div>
          <div class="muted">Servicio</div>
          ${desc}
          <div class="row">
            <span>1 x ${money(s.precioFinalAplicado)}</span>
            <span class="right">${money(s.subtotalNeto)}</span>
          </div>
        </div>`
    })
    .join("")

  const itemsBlock =
    productRows + serviceRows ||
    `<div class="muted center">Sin detalle de ítems</div>`

  const pagoExtra: string[] = []
  if (venta.metodoPago === "Efectivo" || venta.metodoPago === "Pago Mixto") {
    pagoExtra.push(lineItemRow("Efectivo", money(venta.montoEfectivo)))
  }
  if (venta.metodoPago === "QR" || venta.metodoPago === "Pago Mixto") {
    pagoExtra.push(lineItemRow("QR", money(venta.montoQr)))
  }
  if (venta.cambioEfectivo > 0) {
    pagoExtra.push(lineItemRow("Cambio", money(venta.cambioEfectivo)))
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nota ${escapeHtml(venta.codigoNotaVenta)}</title>
  <style>
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
  </style>
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

    <div class="center" style="font-weight:700">NOTA DE VENTA</div>
    <div class="center meta">${escapeHtml(venta.codigoNotaVenta)}</div>
    <div class="center muted">${escapeHtml(formatDateTime(venta.fechaHora))}</div>

    <hr class="sep" />

    <div class="meta">Cliente: ${escapeHtml(venta.clienteNombre || "Cliente Genérico")}</div>
    ${venta.clienteCi ? `<div class="meta muted">CI/NIT: ${escapeHtml(venta.clienteCi)}</div>` : ""}
    <div class="meta">Vendedor: ${escapeHtml(venta.vendedorNombre || "-")}</div>
    ${
      venta.ordenTecnicaCodigo
        ? `<div class="meta muted">OT: ${escapeHtml(venta.ordenTecnicaCodigo)}</div>`
        : ""
    }

    <hr class="sep" />

    ${itemsBlock}

    <hr class="sep-solid" />

    ${lineItemRow("TOTAL", money(venta.total)).replace('class="row"', 'class="row total-row"')}
    ${lineItemRow("Método de pago", escapeHtml(venta.metodoPago))}
    ${pagoExtra.join("")}

    <hr class="sep" />

    <div class="pie">${pie}</div>
    <div class="center muted" style="margin-top:8px">¡Gracias por su compra!</div>
  </div>
</body>
</html>`
}

export function createTicketObjectUrl(html: string): string {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  return window.URL.createObjectURL(blob)
}

export function printTicketHtml(html: string): void {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=420,height=720")
  if (!printWindow) return
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  const triggerPrint = () => {
    printWindow.print()
  }
  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 150)
  } else {
    printWindow.addEventListener("load", () => setTimeout(triggerPrint, 150))
  }
}
