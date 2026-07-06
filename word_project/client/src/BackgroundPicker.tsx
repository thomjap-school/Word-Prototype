import { useRef } from "react";
import { Image, X } from "lucide-react";
import { useBackground } from "./Usebackground";

export default function BackgroundPicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { background, setBackground, clearBackground } = useBackground();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBackground(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        title="Changer le fond d'écran"
        className="flex items-center gap-2 bg-white shadow-md border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Image className="w-4 h-4" />
        Fond d'écran
      </button>
      {background && (
        <button
          onClick={clearBackground}
          title="Réinitialiser le fond d'écran"
          className="flex items-center justify-center bg-white shadow-md border border-gray-200 rounded-full w-9 h-9 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
