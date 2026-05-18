// src/components/ReportesPanel.jsx
import { useState } from "react";
import {
  FileText, Sparkles, AlertTriangle, Loader2,
  TrendingUp, TrendingDown, Minus, ChevronRight,
  Download, RefreshCw,
} from "lucide-react";
import banorteLogo from "../assets/banorte-logo.png";

const API_URL = import.meta.env.VITE_API_URL;

const MESES = [
  { v: 1, l: "Enero" }, { v: 2, l: "Febrero" }, { v: 3, l: "Marzo" },
  { v: 4, l: "Abril" }, { v: 5, l: "Mayo" }, { v: 6, l: "Junio" },
  { v: 7, l: "Julio" }, { v: 8, l: "Agosto" }, { v: 9, l: "Septiembre" },
  { v: 10, l: "Octubre" }, { v: 11, l: "Noviembre" }, { v: 12, l: "Diciembre" },
];

const HOY = new Date();
const fmt = (n) => Number(n).toLocaleString("es-MX", {
  style: "currency",
  currency: "MXN",
});

// Paleta Banorte
const BRAND = {
  red: "#EB0029",
  darkGray: "#323E48",
  gray: "#5B6670",
  content2: "#7B868C",
  content3: "#A2A9AD",
  content4: "#C1C5C8",
  content5: "#CFD2D3",
  bg: "#EBF0F2",
  bg2: "#F4F7F8",
  bg3: "#FCFCFC",
  success: "#6CC04A",
  alert: "#FF671B",
  warning: "#FFA400",
};

const SALUD = {
  buenos: { color: BRAND.success, bg: "#F0FCE8", label: "Buena", Icon: TrendingUp },
  regular: { color: BRAND.warning, bg: "#FFF8E6", label: "Regular", Icon: Minus },
  crítico: { color: BRAND.red, bg: "#FFF0F3", label: "Crítica", Icon: TrendingDown },
};

const BARRA_COLORS = [BRAND.red, BRAND.alert, BRAND.darkGray, BRAND.gray, BRAND.content3];

// ── Convierte img src a base64 para embeber en el PDF ────────────────────────
async function imgToBase64(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ── Construye el HTML del PDF con diseño Banorte ─────────────────────────────
function buildPdfHtml(reporte, logoB64) {
  const { periodo, resumen, categorias, analisisIA, iaError } = reporte;
  const balancePos = resumen.balance >= 0;
  const fechaGen = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const catFilas = categorias.map((c, i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.bg};color:${BRAND.darkGray};font-size:13px">${c.nombre}</td>
      <td style="padding:10px 12px 10px 0;border-bottom:1px solid ${BRAND.bg};text-align:right;font-weight:700;font-size:13px;color:${BRAND.darkGray};white-space:nowrap">${fmt(c.total)}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.bg};text-align:right;color:${BRAND.content2};font-size:12px;white-space:nowrap">${c.porcentaje}%</td>
      <td style="padding:10px 0 10px 16px;border-bottom:1px solid ${BRAND.bg};width:140px">
        <div style="height:8px;background:${BRAND.bg};border-radius:999px;overflow:hidden">
          <div style="height:100%;width:${c.porcentaje}%;background:${BARRA_COLORS[i % BARRA_COLORS.length]};border-radius:999px"></div>
        </div>
      </td>
    </tr>
  `).join("");

  const saludCfg = SALUD[analisisIA?.salud_financiera] ?? SALUD.regular;
  const recosHtml = (analisisIA?.recomendaciones ?? []).map((r) => `
    <tr>
      <td style="padding:7px 0;vertical-align:top;width:18px;color:${BRAND.red};font-size:14px;font-weight:700">›</td>
      <td style="padding:7px 0 7px 8px;font-size:13px;color:${BRAND.darkGray};line-height:1.55">${r}</td>
    </tr>
  `).join("");

  const seccionIA = analisisIA ? `
  <div style="margin-top:24px;border:1px solid ${BRAND.content5};border-radius:16px;overflow:hidden;page-break-inside:avoid;background:white">
    <div style="background:${BRAND.red};padding:16px 22px;display:flex;align-items:center;gap:12px">
      <div style="width:32px;height:32px;background:rgba(255,255,255,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:15px;flex-shrink:0">✦</div>
      <div style="flex:1">
        <p style="color:white;font-weight:700;font-size:15px;margin:0">Análisis Aura</p>
        <p style="color:rgba(255,255,255,0.82);font-size:11px;margin:2px 0 0">Inteligencia Artificial · Banorte</p>
      </div>
      <div style="background:${saludCfg.bg};color:${saludCfg.color};padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap;border:1px solid rgba(50,62,72,0.08)">
        Salud: ${saludCfg.label}
      </div>
    </div>

    <div style="background:${BRAND.bg3};border-top:none;border-radius:0 0 16px 16px;padding:20px 22px">
      ${analisisIA.patron_principal ? `
      <div style="margin-bottom:14px;padding:14px 16px;background:white;border-radius:12px;border:1px solid ${BRAND.content5}">
        <p style="font-size:10px;color:${BRAND.red};text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px;font-weight:700">Patrón de consumo</p>
        <p style="font-size:13px;color:${BRAND.darkGray};margin:0;line-height:1.55">${analisisIA.patron_principal}</p>
      </div>` : ""}

      ${analisisIA.categoria_critica ? `
      <div style="margin-bottom:14px;padding:14px 16px;background:white;border-radius:12px;border:1px solid ${BRAND.content5}">
        <p style="font-size:10px;color:${BRAND.red};text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px;font-weight:700">Área de mayor impacto</p>
        <p style="font-size:13px;color:${BRAND.darkGray};margin:0;line-height:1.55">${analisisIA.categoria_critica}</p>
      </div>` : ""}

      ${recosHtml ? `
      <div style="margin-bottom:14px">
        <p style="font-size:10px;color:${BRAND.gray};font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px">Recomendaciones para el próximo mes</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${(analisisIA?.recomendaciones ?? []).map((r) => `
            <div style="display:flex;align-items:flex-start;gap:8px;background:white;padding:12px 14px;border-radius:12px;border:1px solid ${BRAND.content5}">
              <div style="color:${BRAND.red};font-size:14px;font-weight:700;line-height:1.2">›</div>
              <div style="font-size:13px;color:${BRAND.darkGray};line-height:1.55">${r}</div>
            </div>
          `).join("")}
        </div>
      </div>` : ""}

      ${analisisIA.proyeccion ? `
      <div style="padding:14px 16px;background:${BRAND.bg};border:1px solid ${BRAND.content5};border-radius:12px">
        <p style="font-size:10px;color:${BRAND.red};text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px;font-weight:700">Proyección próximo mes</p>
        <p style="font-size:13px;color:${BRAND.darkGray};margin:0;line-height:1.55">${analisisIA.proyeccion}</p>
      </div>` : ""}
    </div>
  </div>` : "";

  const avisoIA = iaError ? `
  <div style="margin-top:20px;padding:14px 16px;background:#FFF0F3;border:1px solid #FECDD5;border-radius:12px">
    <p style="font-weight:700;color:${BRAND.red};font-size:13px;margin:0 0 4px">⚠ Análisis IA no disponible</p>
    <p style="font-size:12px;color:${BRAND.content2};margin:0">${iaError}</p>
  </div>` : "";

  const logoHtml = logoB64
    ? `<img src="${logoB64}" alt="Banorte" style="height:34px" />`
    : `<div style="background:${BRAND.red};color:white;font-weight:900;font-size:18px;padding:5px 12px;border-radius:6px;letter-spacing:.04em">BANORTE</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte Banorte · ${periodo.mes} ${periodo.anio}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:${BRAND.darkGray};font-size:13px;line-height:1.4}
    .page{padding:36px 44px;max-width:800px;margin:0 auto}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{padding:0}
      @page{size:A4;margin:14mm 12mm}
    }
  </style>
</head>
<body>
  <div class="page">

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:18px;border-bottom:3px solid ${BRAND.red}">
      <div style="display:flex;align-items:center;gap:14px">
        ${logoHtml}
        <div style="width:1px;height:34px;background:${BRAND.content5}"></div>
        <div>
          <p style="font-size:10px;color:${BRAND.content2};text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px">Reporte mensual</p>
          <p style="font-size:17px;font-weight:700;color:${BRAND.darkGray};text-transform:capitalize">${periodo.mes} ${periodo.anio}</p>
        </div>
      </div>
      <div style="background:${BRAND.bg};border-radius:12px;padding:10px 16px;text-align:right">
        <p style="font-size:9px;color:${BRAND.content3};text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">Fecha de emisión</p>
        <p style="font-size:12px;font-weight:600;color:${BRAND.darkGray}">${fechaGen}</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:22px">
      <div style="background:#F0FCE8;border:1.5px solid #A8E88A;border-radius:14px;padding:16px 18px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <div style="width:8px;height:8px;background:${BRAND.success};border-radius:50%"></div>
          <p style="font-size:9px;color:${BRAND.gray};text-transform:uppercase;letter-spacing:.07em;font-weight:700">Ingresos</p>
        </div>
        <p style="font-size:19px;font-weight:800;color:#2A6E14;margin-bottom:4px">${fmt(resumen.totalIngresos)}</p>
        <p style="font-size:11px;color:${BRAND.content3}">${resumen.numIngresos} movimiento${resumen.numIngresos !== 1 ? "s" : ""}</p>
      </div>

      <div style="background:#FFF0F3;border:1.5px solid #FECDD5;border-radius:14px;padding:16px 18px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <div style="width:8px;height:8px;background:${BRAND.red};border-radius:50%"></div>
          <p style="font-size:9px;color:${BRAND.gray};text-transform:uppercase;letter-spacing:.07em;font-weight:700">Egresos</p>
        </div>
        <p style="font-size:19px;font-weight:800;color:${BRAND.red};margin-bottom:4px">${fmt(resumen.totalEgresos)}</p>
        <p style="font-size:11px;color:${BRAND.content3}">${resumen.numEgresos} movimiento${resumen.numEgresos !== 1 ? "s" : ""}</p>
      </div>

      <div style="background:${balancePos ? "#F0FCE8" : "#FFF0F3"};border:1.5px solid ${balancePos ? "#A8E88A" : "#FECDD5"};border-radius:14px;padding:16px 18px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <div style="width:8px;height:8px;background:${balancePos ? BRAND.success : BRAND.red};border-radius:50%"></div>
          <p style="font-size:9px;color:${BRAND.gray};text-transform:uppercase;letter-spacing:.07em;font-weight:700">Balance neto</p>
        </div>
        <p style="font-size:19px;font-weight:800;color:${balancePos ? "#2A6E14" : BRAND.red};margin-bottom:4px">${balancePos ? "+" : ""}${fmt(resumen.balance)}</p>
        <p style="font-size:11px;color:${BRAND.content3}">${resumen.numTransacciones} transacciones</p>
      </div>
    </div>

    ${categorias.length > 0 ? `
    <div style="background:${BRAND.bg3};border:1px solid ${BRAND.content5};border-radius:16px;padding:20px 22px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid ${BRAND.bg}">
        <div style="width:4px;height:20px;background:${BRAND.red};border-radius:999px"></div>
        <p style="font-weight:700;font-size:14px;color:${BRAND.darkGray}">Gastos por categoría</p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="text-align:left;padding:0 0 10px;font-size:9px;color:${BRAND.content2};font-weight:600;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid ${BRAND.bg}">Categoría</th>
            <th style="text-align:right;padding:0 12px 10px 0;font-size:9px;color:${BRAND.content2};font-weight:600;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid ${BRAND.bg}">Total</th>
            <th style="text-align:right;padding:0 0 10px;font-size:9px;color:${BRAND.content2};font-weight:600;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid ${BRAND.bg}">%</th>
            <th style="padding:0 0 10px 16px;border-bottom:2px solid ${BRAND.bg};width:140px"></th>
          </tr>
        </thead>
        <tbody>${catFilas}</tbody>
      </table>
    </div>` : ""}

    ${seccionIA}
    ${avisoIA}

    <div style="margin-top:32px;padding-top:14px;border-top:1px solid ${BRAND.bg};display:flex;justify-content:space-between;align-items:center">
      <p style="font-size:10px;color:${BRAND.content3}">© ${new Date().getFullYear()} Grupo Financiero Banorte, S.A.B. de C.V.</p>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:6px;height:6px;background:${BRAND.red};border-radius:50%"></div>
        <p style="font-size:10px;color:${BRAND.content3}">Generado por Aura · Asistente Financiero</p>
      </div>
    </div>

  </div>
</body>
</html>`;
}

// ── Descarga el PDF ──────────────────────────────────────────────────────────
async function descargarPDF(reporte, logoSrc) {
  const logoB64 = await imgToBase64(logoSrc).catch(() => null);
  const html = buildPdfHtml(reporte, logoB64);

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:none";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.onafterprint = () => document.body.removeChild(iframe);
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 800);
}

// ── SeccionIA ────────────────────────────────────────────────────────────────
function SeccionIA({ analisis, iaError }) {
  if (iaError) {
    return (
      <div style={{
        background: "#FFF0F3",
        border: "1px solid #FECDD5",
        borderRadius: 14,
        padding: "1.25rem",
        marginTop: "1.5rem"
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <AlertTriangle size={16} color={BRAND.red} />
          <p style={{
            fontFamily: '"Gotham",sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: BRAND.red,
            margin: 0
          }}>
            IA no disponible
          </p>
        </div>
        <p style={{
          fontFamily: '"Roboto",sans-serif',
          fontSize: 12,
          color: BRAND.content2,
          margin: 0
        }}>
          {iaError}
        </p>
      </div>
    );
  }

  if (!analisis) return null;

  const salud = SALUD[analisis.salud_financiera] ?? SALUD.regular;
  const { Icon: SaludIcon } = salud;

  return (
    <div style={{
      marginTop: "1.5rem",
      border: `1px solid ${BRAND.content5}`,
      borderRadius: 16,
      overflow: "hidden",
      background: "white",
      boxShadow: "0 6px 18px rgba(50,62,72,0.08)"
    }}>
      <div style={{
        background: BRAND.red,
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: 10
      }}>
        <div style={{
          width: 30,
          height: 30,
          background: "rgba(255,255,255,0.16)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          color: "white",
          flexShrink: 0
        }}>
          ✦
        </div>

        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: '"Gotham",sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: "white",
            margin: 0
          }}>
            Análisis Aura
          </p>
          <p style={{
            fontFamily: '"Roboto",sans-serif',
            fontSize: 11,
            color: "rgba(255,255,255,0.82)",
            margin: "2px 0 0"
          }}>
            Inteligencia Artificial · Banorte
          </p>
        </div>

        <span style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: salud.bg,
          color: salud.color,
          padding: "4px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          border: "1px solid rgba(50,62,72,0.08)"
        }}>
          <SaludIcon size={12} /> {salud.label}
        </span>
      </div>

      <div style={{
        padding: "1.25rem",
        background: BRAND.bg3,
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        {analisis.patron_principal && (
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: "0.95rem 1rem",
            border: `1px solid ${BRAND.content5}`
          }}>
            <p style={{
              fontFamily: '"Gotham",sans-serif',
              fontSize: 10,
              color: BRAND.red,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 5px",
              fontWeight: 700
            }}>
              Patrón de consumo
            </p>
            <p style={{
              fontFamily: '"Roboto",sans-serif',
              fontSize: 13,
              color: BRAND.darkGray,
              margin: 0,
              lineHeight: 1.55
            }}>
              {analisis.patron_principal}
            </p>
          </div>
        )}

        {analisis.categoria_critica && (
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: "0.95rem 1rem",
            border: `1px solid ${BRAND.content5}`
          }}>
            <p style={{
              fontFamily: '"Gotham",sans-serif',
              fontSize: 10,
              color: BRAND.red,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 5px",
              fontWeight: 700
            }}>
              Área de mayor impacto
            </p>
            <p style={{
              fontFamily: '"Roboto",sans-serif',
              fontSize: 13,
              color: BRAND.darkGray,
              margin: 0,
              lineHeight: 1.55
            }}>
              {analisis.categoria_critica}
            </p>
          </div>
        )}

        {analisis.recomendaciones?.length > 0 && (
          <div>
            <p style={{
              fontFamily: '"Gotham",sans-serif',
              fontSize: 11,
              color: BRAND.gray,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              margin: "0 0 8px"
            }}>
              Recomendaciones para el próximo mes
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {analisis.recomendaciones.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    background: "white",
                    padding: "0.85rem 1rem",
                    borderRadius: 12,
                    border: `1px solid ${BRAND.content5}`
                  }}
                >
                  <ChevronRight size={13} color={BRAND.red} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{
                    fontFamily: '"Roboto",sans-serif',
                    fontSize: 13,
                    color: BRAND.darkGray,
                    margin: 0,
                    lineHeight: 1.55
                  }}>
                    {r}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {analisis.proyeccion && (
          <div style={{
            background: BRAND.bg,
            borderRadius: 12,
            padding: "0.95rem 1rem",
            border: `1px solid ${BRAND.content5}`
          }}>
            <p style={{
              fontFamily: '"Gotham",sans-serif',
              fontSize: 10,
              color: BRAND.red,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 5px",
              fontWeight: 700
            }}>
              Proyección próximo mes
            </p>
            <p style={{
              fontFamily: '"Roboto",sans-serif',
              fontSize: 13,
              color: BRAND.darkGray,
              margin: 0,
              lineHeight: 1.55
            }}>
              {analisis.proyeccion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ReporteViewer ────────────────────────────────────────────────────────────
function ReporteViewer({ reporte, onNuevoReporte }) {
  const { periodo, resumen, categorias, analisisIA, iaError } = reporte;
  const [descargando, setDescargando] = useState(false);
  const balancePositivo = resumen.balance >= 0;

  const handleDescargar = async () => {
    setDescargando(true);
    await descargarPDF(reporte, banorteLogo);
    setDescargando(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{
            fontFamily: '"Roboto",sans-serif',
            fontSize: 11,
            color: BRAND.content3,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: 0
          }}>
            Reporte financiero
          </p>
          <h3 style={{
            fontFamily: '"Gotham",sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: BRAND.darkGray,
            margin: "2px 0 0",
            textTransform: "capitalize"
          }}>
            {periodo.mes} {periodo.anio}
          </h3>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleDescargar}
            disabled={descargando}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: descargando ? BRAND.content4 : BRAND.red,
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "8px 16px",
              fontFamily: '"Gotham",sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: descargando ? "not-allowed" : "pointer",
              transition: "background 0.15s"
            }}
            onMouseEnter={(e) => { if (!descargando) e.currentTarget.style.background = "#C8001F"; }}
            onMouseLeave={(e) => { if (!descargando) e.currentTarget.style.background = BRAND.red; }}
          >
            {descargando
              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Preparando…</>
              : <><Download size={13} /> Descargar PDF</>}
          </button>

          <button
            onClick={onNuevoReporte}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: `1px solid ${BRAND.content5}`,
              borderRadius: 10,
              padding: "8px 16px",
              fontFamily: '"Gotham",sans-serif',
              fontSize: 12,
              color: BRAND.gray,
              cursor: "pointer",
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = BRAND.red;
              e.currentTarget.style.color = BRAND.red;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = BRAND.content5;
              e.currentTarget.style.color = BRAND.gray;
            }}
          >
            <RefreshCw size={13} /> Nuevo reporte
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.75rem" }}>
        {[
          { label: "Ingresos", valor: resumen.totalIngresos, color: BRAND.success, bg: "#F0FCE8", border: "#A8E88A", txs: resumen.numIngresos },
          { label: "Egresos", valor: resumen.totalEgresos, color: BRAND.red, bg: "#FFF0F3", border: "#FECDD5", txs: resumen.numEgresos },
          { label: "Balance neto", valor: resumen.balance, color: balancePositivo ? BRAND.success : BRAND.red, bg: balancePositivo ? "#F0FCE8" : "#FFF0F3", border: balancePositivo ? "#A8E88A" : "#FECDD5", txs: null },
        ].map(({ label, valor, color, bg, border, txs }) => (
          <div key={label} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: "1rem 1.1rem" }}>
            <p style={{
              fontFamily: '"Roboto",sans-serif',
              fontSize: 10,
              color: BRAND.gray,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 6px",
              fontWeight: 600
            }}>
              {label}
            </p>
            <p style={{
              fontFamily: '"Gotham",sans-serif',
              fontSize: 18,
              fontWeight: 800,
              color,
              margin: "0 0 4px"
            }}>
              {balancePositivo && label === "Balance neto" ? "+" : ""}{fmt(valor)}
            </p>
            {txs !== null && (
              <p style={{
                fontFamily: '"Roboto",sans-serif',
                fontSize: 11,
                color: BRAND.content3,
                margin: 0
              }}>
                {txs} movimientos
              </p>
            )}
          </div>
        ))}
      </div>

      {categorias.length > 0 && (
        <div style={{
          background: "white",
          border: `1px solid ${BRAND.content5}`,
          borderRadius: 16,
          padding: "1.1rem 1.25rem"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: "0.75rem",
            paddingBottom: "0.75rem",
            borderBottom: `1px solid ${BRAND.bg}`
          }}>
            <div style={{ width: 4, height: 18, background: BRAND.red, borderRadius: 999 }} />
            <p style={{
              fontFamily: '"Gotham",sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: BRAND.darkGray,
              margin: 0
            }}>
              Gastos por categoría
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {categorias.map((cat, i) => (
              <div key={cat.nombre}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{
                    fontFamily: '"Roboto",sans-serif',
                    fontSize: 13,
                    color: BRAND.gray
                  }}>
                    {cat.nombre}
                  </span>
                  <span style={{
                    fontFamily: '"Gotham",sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: BRAND.darkGray
                  }}>
                    {fmt(cat.total)}{" "}
                    <span style={{ fontSize: 11, color: BRAND.content3, fontWeight: 400 }}>
                      ({cat.porcentaje}%)
                    </span>
                  </span>
                </div>

                <div style={{ height: 7, background: BRAND.bg, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${cat.porcentaje}%`,
                    borderRadius: 999,
                    background: BARRA_COLORS[i % BARRA_COLORS.length],
                    transition: "width 0.6s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SeccionIA analisis={analisisIA} iaError={iaError} />
    </div>
  );
}

// ── Panel principal ──────────────────────────────────────────────────────────
export default function ReportesPanel() {
  const [anio, setAnio] = useState(HOY.getFullYear());
  const [mes, setMes] = useState(HOY.getMonth() + 1);
  const [useIA, setUseIA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState(null);

  const ANIOS = Array.from({ length: 5 }, (_, i) => HOY.getFullYear() - i);

  const handleGenerar = async () => {
    setLoading(true);
    setError(null);
    setReporte(null);

    try {
      const res = await fetch(`${API_URL}/api/reportes/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anio, mes, useIA }),
      });

      const data = await res.json();

      if (res.status === 404 && data.sinDatos) {
        setError(data.message);
        return;
      }

      if (!res.ok) {
        setError(data.message || "Error al generar el reporte.");
        return;
      }

      setReporte(data);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const mesLabel = MESES.find((m) => m.v === mes)?.l ?? "";

  return (
    <div className="card" style={{ maxWidth: 680, width: "100%", margin: "0 auto", padding: "2rem" }}>
      {!reporte && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.25rem" }}>
            <FileText size={22} color={BRAND.red} />
            <h2 style={{
              fontFamily: '"Gotham",sans-serif',
              fontSize: 22,
              fontWeight: 700,
              color: BRAND.darkGray,
              margin: 0
            }}>
              Reporte mensual
            </h2>
          </div>

          <p style={{
            fontFamily: '"Roboto",sans-serif',
            fontSize: 13,
            color: BRAND.content2,
            marginBottom: "1.75rem"
          }}>
            Genera un resumen financiero de tus movimientos con opción de análisis por IA.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            {[
              { label: "Mes", value: mes, onChange: (e) => setMes(Number(e.target.value)), options: MESES.map((m) => ({ v: m.v, l: m.l })) },
              { label: "Año", value: anio, onChange: (e) => setAnio(Number(e.target.value)), options: ANIOS.map((a) => ({ v: a, l: String(a) })) },
            ].map(({ label, value, onChange, options }) => (
              <div key={label}>
                <label style={{
                  fontFamily: '"Gotham",sans-serif',
                  fontSize: 12,
                  color: BRAND.gray,
                  display: "block",
                  marginBottom: 6
                }}>
                  {label}
                </label>
                <select
                  value={value}
                  onChange={onChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1.5px solid ${BRAND.content5}`,
                    borderRadius: 10,
                    fontFamily: '"Gotham",sans-serif',
                    fontSize: 14,
                    color: BRAND.darkGray,
                    background: "white",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  {options.map((o) => (
                    <option key={o.v} value={o.v}>{o.l}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div
            onClick={() => setUseIA((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "1rem 1.25rem",
              borderRadius: 14,
              cursor: "pointer",
              border: `1.5px solid ${useIA ? BRAND.red : BRAND.content5}`,
              background: useIA ? "#FFF5F7" : BRAND.bg3,
              transition: "all 0.2s",
              marginBottom: "1.5rem"
            }}
          >
            <div style={{
              width: 44,
              height: 24,
              borderRadius: 999,
              flexShrink: 0,
              background: useIA ? BRAND.red : BRAND.content4,
              position: "relative",
              transition: "background 0.2s"
            }}>
              <div style={{
                position: "absolute",
                top: 3,
                left: useIA ? 22 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                transition: "left 0.2s"
              }} />
            </div>

            <div>
              <p style={{
                fontFamily: '"Gotham",sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: useIA ? BRAND.red : BRAND.darkGray,
                margin: 0
              }}>
                <Sparkles size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                {" "}Incluir análisis con IA
              </p>
              <p style={{
                fontFamily: '"Roboto",sans-serif',
                fontSize: 11,
                color: BRAND.content2,
                margin: "2px 0 0"
              }}>
                Aura analizará tus patrones y dará recomendaciones personalizadas
              </p>
            </div>
          </div>

          {error && (
            <div style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              background: "#FFF0F3",
              border: "1px solid #FECDD5",
              borderRadius: 12,
              padding: "0.9rem 1rem",
              marginBottom: "1rem"
            }}>
              <AlertTriangle size={16} color={BRAND.red} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{
                fontFamily: '"Roboto",sans-serif',
                fontSize: 13,
                color: BRAND.red,
                margin: 0
              }}>
                {error}
              </p>
            </div>
          )}

          <button
            onClick={handleGenerar}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? BRAND.content4 : BRAND.red,
              color: "white",
              border: "none",
              borderRadius: 12,
              fontFamily: '"Gotham",sans-serif',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.15s"
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#C8001F"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = loading ? BRAND.content4 : BRAND.red; }}
          >
            {loading
              ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />{useIA ? "Aura está analizando tu información…" : "Generando reporte…"}</>
              : <><FileText size={16} />Generar reporte de {mesLabel} {anio}</>}
          </button>

          {useIA && (
            <p style={{
              fontFamily: '"Roboto",sans-serif',
              fontSize: 11,
              color: BRAND.content3,
              textAlign: "center",
              marginTop: 8
            }}>
              El análisis con IA puede tardar unos segundos. Requiere que Ollama esté corriendo.
            </p>
          )}
        </>
      )}

      {reporte && (
        <ReporteViewer
          reporte={reporte}
          onNuevoReporte={() => {
            setReporte(null);
            setError(null);
          }}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}