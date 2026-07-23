import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { verifyEmail } from "../services/authService";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien de confirmation invalide.");
      return;
    }
    verifyEmail(token)
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Lien de confirmation invalide.");
      });
  }, [token]);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Confirmation du compte</h1>

        {status === "loading" && (
          <p className="auth-subtitle">
            <LoaderCircle className="w-4 h-4 animate-spin" style={{ display: "inline" }} /> Vérification en cours...
          </p>
        )}

        {status === "success" && <div className="alert alert--success">{message}</div>}
        {status === "error" && <div className="alert alert--error">{message}</div>}

        <p className="auth-footer">
          <Link to="/login" className="auth-link">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
