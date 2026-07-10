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
    <div className="page-shell join-page-center">
      {error ? (
        <div className="join-error-wrap">
          <p className="join-error-text">{error}</p>
          <button onClick={() => navigate("/")} className="join-error-link">
            Retour à l'accueil
          </button>
        </div>
      ) : (
        <div className="join-loading">
          <LoaderCircle className="w-4 h-4 animate-spin" />
          Connexion au document...
        </div>
      )}
    </div>
  );
}
