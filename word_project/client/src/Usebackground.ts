import { useEffect, useState } from "react";

const STORAGE_KEY = "app-background";

export function useBackground() {
  const [background, setBackgroundState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  useEffect(() => {
    if (background) {
      document.body.style.backgroundImage = `url(${background})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.backgroundImage = "";
    }
  }, [background]);

  const setBackground = (dataUrl: string) => {
    localStorage.setItem(STORAGE_KEY, dataUrl);
    setBackgroundState(dataUrl);
  };

  const clearBackground = () => {
    localStorage.removeItem(STORAGE_KEY);
    setBackgroundState(null);
  };

  return { background, setBackground, clearBackground };
}
