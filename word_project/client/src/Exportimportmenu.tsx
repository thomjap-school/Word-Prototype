import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Download, Upload, FileText, LoaderCircle } from "lucide-react";
import { exportToPdf, importDocx, importPdf } from "./Exportimport";

interface ExportImportMenuProps {
  editor: Editor;
  title: string;
}

export default function ExportImportMenu({
  editor,
  title,
}: ExportImportMenuProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPdf = () => {
    exportToPdf(editor.getHTML(), title);
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
    <div className="flex items-center gap-2 relative">
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
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition px-3 h-8 rounded-lg border border-gray-200"
      >
        {importing ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : (
          <Upload size={14} />
        )}
        Importer
      </button>

      <div className="relative">
        <button
          onClick={() => setExportOpen((v) => !v)}
          title="Exporter le document"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition px-3 h-8 rounded-lg border border-gray-200"
        >
          <Download size={14} />
          Exporter
        </button>

        {exportOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white shadow-md border border-gray-200 rounded-lg py-1 w-40 z-20">
            <button
              onClick={handleExportPdf}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileText size={14} />
              PDF
            </button>
          </div>
        )}
      </div>

      {importError && (
        <span className="absolute top-full right-0 mt-1 text-xs text-red-600 whitespace-nowrap">
          {importError}
        </span>
      )}
    </div>
  );
}
