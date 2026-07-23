import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Download, Upload, FileText, LoaderCircle } from "lucide-react";
import {
  exportToPdf,
  exportToDocx,
  exportToTxt,
  exportToMarkdown,
  exportToRtf,
  exportToOdt,
  importDocx,
  importPdf,
} from "./Exportimport";

interface ExportImportMenuProps {
  editor: Editor;
  title: string;
}

const EXPORT_FORMATS = [
  { label: "PDF", handler: exportToPdf },
  { label: "Word (.docx)", handler: exportToDocx },
  { label: "Texte (.txt)", handler: exportToTxt },
  { label: "Markdown (.md)", handler: exportToMarkdown },
  { label: "RTF (.rtf)", handler: exportToRtf },
  { label: "OpenDocument (.odt)", handler: exportToOdt },
] as const;

export default function ExportImportMenu({
  editor,
  title,
}: ExportImportMenuProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (handler: (html: string, filename: string) => void | Promise<void>) => {
    handler(editor.getHTML(), title);
    setExportOpen(false);
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setImporting(true);
    setImportError(null);

    try {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      const isDocx = file.name.toLowerCase().endsWith(".docx");

      if (!isPdf && !isDocx) {
        throw new Error("Format non supporté (.docx ou .pdf uniquement)");
      }

      const html = isPdf
        ? await importPdf(file)
        : await importDocx(file);

      editor.commands.setContent(html);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Échec de l'import"
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="toolbar-action-group">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleImportClick}
        disabled={importing}
        title="Importer un document (.docx ou .pdf)"
        className="toolbar-action-btn"
      >
        {importing ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : (
          <Upload size={14} />
        )}
        <span className="btn-label">Importer</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setExportOpen((v) => !v)}
          title="Exporter le document"
          className="toolbar-action-btn"
        >
          <Download size={14} />
          <span className="btn-label">Exporter</span>
        </button>

        {exportOpen && (
          <div className="export-dropdown">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.label}
                onClick={() => handleExport(format.handler)}
                className="export-dropdown-item"
              >
                <FileText size={14} />
                {format.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {importError && <span className="import-error">{importError}</span>}
    </div>
  );
}
