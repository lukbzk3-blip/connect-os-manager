/**
 * Geração de PDF por impressão do navegador (Salvar como PDF).
 * Não depende de bibliotecas externas e não altera nenhum dado.
 */

const BASE_CSS = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1c2321; margin: 0; padding: 24px; font-size: 12px; }
  h1, h2, h3 { margin: 0; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 3px solid #2e7d54; padding-bottom: 12px; margin-bottom: 16px; }
  .brand { font-size: 18px; font-weight: 800; color: #2e7d54; letter-spacing: -0.3px; }
  .brand small { display: block; font-weight: 500; color: #64726b; font-size: 11px; letter-spacing: 0; }
  .doc-title { text-align: right; }
  .doc-title h2 { font-size: 16px; }
  .doc-title span { color: #64726b; font-size: 11px; }
  section { margin-bottom: 14px; page-break-inside: avoid; }
  section > h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px; color: #2e7d54; border-bottom: 1px solid #dfe6e2; padding-bottom: 4px; margin-bottom: 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
  .row { display: flex; gap: 6px; padding: 2px 0; }
  .row b { color: #64726b; font-weight: 600; min-width: 120px; }
  .block { white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { text-align: left; padding: 5px 6px; border-bottom: 1px solid #e6ebe8; }
  th { background: #f2f6f4; color: #3c4a43; text-transform: uppercase; font-size: 10px; letter-spacing: 0.4px; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .totais { margin-left: auto; width: 260px; }
  .totais .row { justify-content: space-between; }
  .total-final { border-top: 2px solid #2e7d54; margin-top: 4px; padding-top: 6px; font-size: 14px; font-weight: 800; }
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .card { border: 1px solid #dfe6e2; border-radius: 8px; padding: 8px; }
  .card span { display: block; color: #64726b; font-size: 10px; text-transform: uppercase; }
  .card b { font-size: 13px; }
  .assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .assinatura { border-top: 1px solid #90a09a; padding-top: 4px; text-align: center; color: #64726b; font-size: 11px; }
  footer { margin-top: 18px; border-top: 1px solid #dfe6e2; padding-top: 8px; color: #8b9891; font-size: 10px; text-align: center; }
  @page { size: A4; margin: 12mm; }
`;

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function linha(label: string, value?: string | null): string {
  if (!value) return "";
  return `<div class="row"><b>${escapeHtml(label)}</b><span>${escapeHtml(value)}</span></div>`;
}

/** Abre a caixa de impressão do navegador com o documento pronto para salvar em PDF. */
export function imprimirDocumento(titulo: string, corpo: string) {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
    <title>${escapeHtml(titulo)}</title><style>${BASE_CSS}</style></head>
    <body>${corpo}</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const run = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => iframe.remove(), 1000);
  };
  if (doc.readyState === "complete") window.setTimeout(run, 100);
  else iframe.onload = () => window.setTimeout(run, 100);
}
