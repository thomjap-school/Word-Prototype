import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { register } from "./authService";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, full_name: fullName || undefined });

      navigate("/login", { state: { registered: true } }); // le message sur LoginPage invite à vérifier ses emails
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Créer un compte</h1>
        <p className="auth-subtitle">Rejoignez votre espace de travail</p>

        {error && (
          <div className="alert alert--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label htmlFor="fullName" className="form-label">
              Nom complet
            </label>
            <div className="input-wrap">
              <User className="input-icon" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                placeholder="Jean Dupont"
              />
            </div>
          </div>

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
                minLength={8}
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

          <div>
            <label htmlFor="confirmPassword" className="form-label">
              Confirmer le mot de passe
            </label>
            <div className="input-wrap">
              <Lock className="input-icon" />
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
            Créer mon compte
          </button>
        </form>

        <p className="auth-footer">
          Déjà un compte ?{" "}
          <Link to="/login" className="auth-link">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
