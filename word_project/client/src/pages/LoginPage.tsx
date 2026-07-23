import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { login, resendVerification, reactivateAccount, AccountPendingDeletionError } from "../services/authService";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";

const UNVERIFIED_MESSAGE = "Confirme ton email avant de te connecter";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as
    | { registered?: boolean; accountDeleted?: boolean; message?: string }
    | null;
  const justRegistered = locationState?.registered;
  const accountDeletedMessage = locationState?.accountDeleted ? locationState.message : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  // Rempli quand le backend répond 410 (compte en attente de suppression) :
  // on affiche alors un bouton "réactiver" à la place du message d'erreur classique.
  const [pendingDeletion, setPendingDeletion] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResendState("idle");
    setPendingDeletion(false);
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      if (err instanceof AccountPendingDeletionError) {
        setPendingDeletion(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Échec de la connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setError(null);
    setReactivating(true);
    try {
      await reactivateAccount({ email, password });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la réactivation");
      setPendingDeletion(false);
    } finally {
      setReactivating(false);
    }
  };

  const handleResend = async () => {
    setResendState("sending");
    try {
      await resendVerification(email);
    } finally {
      setResendState("sent");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-eyebrow">
          <span className="auth-eyebrow-dot" />
          word_prototype // auth
        </div>

        <h1 className="auth-title">Connexion</h1>
        <p className="auth-subtitle">Accédez à votre espace de travail</p>

        {justRegistered && !error && (
          <div className="alert alert--success alert--with-icon">
            Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse avant de te connecter.
          </div>
        )}

        {accountDeletedMessage && !error && (
          <div className="alert alert--success alert--with-icon">
            {accountDeletedMessage}
          </div>
        )}

        {error && (
          <div className="alert alert--error">
            {error}
            {error === UNVERIFIED_MESSAGE && (
              <>
                {" "}
                {resendState === "sent" ? (
                  <span>Email de confirmation renvoyé si le compte existe.</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendState === "sending"}
                    className="auth-link"
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  >
                    Renvoyer l'email de confirmation
                  </button>
                )}
              </>
            )}

            {pendingDeletion && (
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleReactivate}
                  disabled={reactivating}
                  className="btn-primary"
                >
                  {reactivating && <LoaderCircle className="w-4 h-4 animate-spin" />}
                  Réactiver mon compte
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <div className="input-wrap">
              <Mail className="input-icon" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="vous@exemple.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Mot de passe
            </label>
            <div className="input-wrap">
              <Lock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input form-input--with-toggle"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="input-toggle"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
            Se connecter
          </button>
        </form>

        <GoogleSignInButton />

        <p className="auth-footer">
          Pas encore de compte ?{" "}
          <Link to="/register" className="auth-link">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
