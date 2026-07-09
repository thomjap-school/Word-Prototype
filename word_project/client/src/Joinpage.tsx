import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { joinViaShareLink } from "./documentService";

export default function JoinPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    joinViaShareLink(token)
      .then((doc) => navigate(`/editor/${doc.id}`, { replace: true }))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lien de partage invalide")
      );
  }, [token, navigate]);

  return (
    <div className="page-shell flex items-center justify-center min-h-screen">
      {error ? (
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button onClick={() => navigate("/")} className="text-sm text-blue-600 hover:underline">
            Retour à l'accueil
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <LoaderCircle className="w-4 h-4 animate-spin" />
          Connexion au document...
        </div>
      )}
    </div>
  );
}
