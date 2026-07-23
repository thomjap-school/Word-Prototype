import html2pdf from "html2pdf.js";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import TurndownService from "turndown";
import JSZip from "jszip";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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

export function exportToTxt(html: string, filename: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  const text = container.innerText || container.textContent || "";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${filename}.txt`);
}

export function exportToMarkdown(html: string, filename: string) {
  const turndown = new TurndownService({ headingStyle: "atx" });
  const markdown = turndown.turndown(html);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, `${filename}.md`);
}

// ---- Utilitaires communs de parcours du DOM (RTF / ODT / DOCX) ----
function escapeRtf(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/{/g, "\\{").replace(/}/g, "\\}");
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function nodeToRtf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeRtf(node.textContent || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const inner = Array.from(el.childNodes).map(nodeToRtf).join("");
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "strong":
    case "b":
      return `{\\b ${inner}}`;
    case "em":
    case "i":
      return `{\\i ${inner}}`;
    case "u":
      return `{\\ul ${inner}}`;
    default:
      return inner;
  }
}

export function exportToRtf(html: string, filename: string) {
  const container = document.createElement("div");
  container.innerHTML = html;

  const blocks: string[] = [];
  container.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const content = nodeToRtf(el);

    if (tag === "h1") {
      blocks.push(`{\\fs36\\b ${content}}\\par\\par`);
    } else if (tag === "h2") {
      blocks.push(`{\\fs28\\b ${content}}\\par\\par`);
    } else if (tag === "li") {
      blocks.push(`\\bullet  ${content}\\par`);
    } else {
      blocks.push(`${content}\\par\\par`);
    }
  });

  const rtf = `{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Arial;}} \\f0\\fs22 ${blocks.join("\n")}}`;
  const blob = new Blob([rtf], { type: "application/rtf" });
  downloadBlob(blob, `${filename}.rtf`);
}

// ---- ODT (OpenDocument) ----
function nodeToOdtSpans(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeXml(node.textContent || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const inner = Array.from(el.childNodes).map(nodeToOdtSpans).join("");
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "strong":
    case "b":
      return `<text:span text:style-name="Bold">${inner}</text:span>`;
    case "em":
    case "i":
      return `<text:span text:style-name="Italic">${inner}</text:span>`;
    case "u":
      return `<text:span text:style-name="Underline">${inner}</text:span>`;
    default:
      return inner;
  }
}

export async function exportToOdt(html: string, filename: string) {
  const container = document.createElement("div");
  container.innerHTML = html;

  const bodyParts: string[] = [];
  container.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const spans = nodeToOdtSpans(el);

    if (tag === "h1") {
      bodyParts.push(`<text:h text:outline-level="1">${spans}</text:h>`);
    } else if (tag === "h2") {
      bodyParts.push(`<text:h text:outline-level="2">${spans}</text:h>`);
    } else if (tag === "li") {
      bodyParts.push(`<text:p>• ${spans}</text:p>`);
    } else {
      bodyParts.push(`<text:p>${spans}</text:p>`);
    }
  });

  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:automatic-styles>
    <style:style style:name="Bold" style:family="text">
      <style:text-properties fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Italic" style:family="text">
      <style:text-properties fo:font-style="italic"/>
    </style:style>
    <style:style style:name="Underline" style:family="text">
      <style:text-properties style:text-underline-style="solid"/>
    </style:style>
  </office:automatic-styles>
  <office:body>
    <office:text>
      ${bodyParts.join("\n")}
    </office:text>
  </office:body>
</office:document-content>`;

  const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

  const zip = new JSZip();
  zip.file("mimetype", "application/vnd.oasis.opendocument.text", { compression: "STORE" });
  zip.file("META-INF/manifest.xml", manifestXml);
  zip.file("content.xml", contentXml);

  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.oasis.opendocument.text" });
  downloadBlob(blob, `${filename}.odt`);
}

// ---- DOCX (Word) : générateur OOXML minimal maison, sans lib externe ----
function nodeToDocxRuns(
  node: Node,
  marks: { bold?: boolean; italic?: boolean; underline?: boolean } = {}
): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = escapeXml(node.textContent || "");
    if (!text) return "";
    const rPr = [
      marks.bold ? "<w:b/>" : "",
      marks.italic ? "<w:i/>" : "",
      marks.underline ? '<w:u w:val="single"/>' : "",
    ].join("");
    const rPrTag = rPr ? `<w:rPr>${rPr}</w:rPr>` : "";
    return `<w:r>${rPrTag}<w:t xml:space="preserve">${text}</w:t></w:r>`;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const nextMarks = { ...marks };
  if (tag === "strong" || tag === "b") nextMarks.bold = true;
  if (tag === "em" || tag === "i") nextMarks.italic = true;
  if (tag === "u") nextMarks.underline = true;

  return Array.from(el.childNodes)
    .map((child) => nodeToDocxRuns(child, nextMarks))
    .join("");
}

export async function exportToDocx(html: string, filename: string) {
  const container = document.createElement("div");
  container.innerHTML = html;

  const paragraphs: string[] = [];
  container.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "h1") {
      const runs = nodeToDocxRuns(el, { bold: true });
      paragraphs.push(`<w:p><w:pPr><w:rPr><w:sz w:val="36"/></w:rPr></w:pPr>${runs}</w:p>`);
    } else if (tag === "h2") {
      const runs = nodeToDocxRuns(el, { bold: true });
      paragraphs.push(`<w:p><w:pPr><w:rPr><w:sz w:val="28"/></w:rPr></w:pPr>${runs}</w:p>`);
    } else if (tag === "li") {
      const runs = nodeToDocxRuns(el);
      paragraphs.push(`<w:p><w:r><w:t xml:space="preserve">• </w:t></w:r>${runs}</w:p>`);
    } else {
      const runs = nodeToDocxRuns(el);
      paragraphs.push(`<w:p>${runs}</w:p>`);
    }
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join("\n")}
    <w:sectPr/>
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypesXml);
  zip.file("_rels/.rels", relsXml);
  zip.file("word/document.xml", documentXml);

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  downloadBlob(blob, `${filename}.docx`);
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
