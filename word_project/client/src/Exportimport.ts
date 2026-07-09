import html2pdf from "html2pdf.js";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export function exportToPdf(html: string, filename: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.padding = "24px";
  container.style.fontFamily = "sans-serif";

  html2pdf()
    .from(container)
    .set({
      filename: `${filename}.pdf`,
      margin: 10,
    })
    .save();
}

export async function importDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}

export async function importPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let html = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const text = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");

    if (text.trim()) {
      html += `<p>${text}</p>`;
    }
  }

  return html || "<p></p>";
}
