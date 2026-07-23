import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { joinViaShareLink } from "../services/documentService";

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
    <div className="page-shell join-page-center">
      {error ? (
        <div className="join-error-wrap">
          <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
          <p className="join-error-text">{error}</p>
          <button onClick={() => navigate("/")} className="join-error-link">
            Retour à l'accueil
          </button>
        </div>
      ) : (
        <div className="join-loading">
          <span className="editor-loading-cursor" />
          connexion_au_document...
        </div>
      )}
    </div>
  );
}
