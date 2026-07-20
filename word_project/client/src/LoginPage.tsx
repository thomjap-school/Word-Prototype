import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { login, resendVerification } from "./authService";
import GoogleSignInButton from "./GoogleSignInButton";

const UNVERIFIED_MESSAGE = "Confirme ton email avant de te connecter";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResendState("idle");
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion");
    } finally {
      setLoading(false);
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
