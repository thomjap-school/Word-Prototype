import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Lock, LoaderCircle, Check, LogOut, Trash2 } from "lucide-react";
import { getCurrentUser, updateProfile, changePassword, deleteAccount, logout, type UserOut } from "./authService";
import MusicPlayer from "./MusicPlayer";
import MobileMenu from "./MobileMenu";

function getInitials(fullName: string | null, email: string) {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Formulaire infos
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Formulaire mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Suppression de compte
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setUser(u);
        setFullName(u.full_name ?? "");
        setEmail(u.email);
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoadingUser(false));
  }, [navigate]);

  const handleProfileSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ full_name: fullName, email });
      setUser(updated);
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Échec de la mise à jour");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Échec du changement de mot de passe");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeletingAccount(true);
    try {
      await deleteAccount();
      // deleteAccount() a déjà nettoyé le token localement (voir authService).
      navigate("/login", {
        state: {
          accountDeleted: true,
          message: "Ton compte a été supprimé. Tu as 3 jours pour le réactiver en te reconnectant.",
        },
      });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Échec de la suppression du compte");
      setDeletingAccount(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="editor-loading">
        <span className="editor-loading-cursor" />
        loading_profile...
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="app-header app-header--between">
        <button onClick={() => navigate("/")} className="editor-back-btn">
          <ArrowLeft size={15} />
          <span className="btn-label">Retour</span>
        </button>

        <div className="app-header-center">
          <MusicPlayer />
        </div>

        <MobileMenu>
          <button
            className="mobile-menu-item mobile-menu-item--danger"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={15} />
            Déconnexion
          </button>
        </MobileMenu>
      </header>

      <main className="home-main">
        <p className="section-label">Mon profil</p>

        {user && (
          <div className="profile-header">
            <div className="profile-avatar-lg">
              {getInitials(user.full_name, user.email)}
            </div>
            <div>
              <p className="profile-name">{user.full_name || user.email}</p>
              <p className="profile-meta">
                membre depuis le {new Date(user.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        )}

        {/* Infos du compte */}
        <div className="profile-card mb-6">
          <h2 className="profile-section-title">Informations</h2>
          <p className="auth-subtitle">Modifie ton nom ou ton adresse email</p>

          {profileError && <div className="alert alert--error">{profileError}</div>}
          {profileSuccess && (
            <div className="alert alert--success alert--with-icon">
              <Check className="w-4 h-4" />
              Profil mis à jour.
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="auth-form">
            <div>
              <label htmlFor="fullName" className="form-label">Nom complet</label>
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
              <label htmlFor="email" className="form-label">Email</label>
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

            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile && <LoaderCircle className="w-4 h-4 animate-spin" />}
              Enregistrer
            </button>
          </form>
        </div>

        {/* Mot de passe */}
        <div className="profile-card mb-6">
          <h2 className="profile-section-title">Mot de passe</h2>
          <p className="auth-subtitle">Change ton mot de passe de connexion</p>

          {passwordError && <div className="alert alert--error">{passwordError}</div>}
          {passwordSuccess && (
            <div className="alert alert--success alert--with-icon">
              <Check className="w-4 h-4" />
              Mot de passe mis à jour.
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="auth-form">
            <div>
              <label htmlFor="currentPassword" className="form-label">Mot de passe actuel</label>
              <div className="input-wrap">
                <Lock className="input-icon" />
                <input
                  id="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="form-label">Nouveau mot de passe</label>
              <div className="input-wrap">
                <Lock className="input-icon" />
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="form-label">Confirmer le nouveau mot de passe</label>
              <div className="input-wrap">
                <Lock className="input-icon" />
                <input
                  id="confirmNewPassword"
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={savingPassword} className="btn-primary">
              {savingPassword && <LoaderCircle className="w-4 h-4 animate-spin" />}
              Changer le mot de passe
            </button>
          </form>
        </div>

        {/* Zone dangereuse : suppression de compte */}
        <div className="profile-card">
          <h2 className="profile-section-title">Supprimer mon compte</h2>
          <p className="auth-subtitle">
            Ton compte sera désactivé immédiatement. Tu auras 3 jours pour le
            réactiver en te reconnectant, passé ce délai il sera définitivement supprimé.
          </p>

          {deleteError && <div className="alert alert--error">{deleteError}</div>}

          {!confirmingDelete ? (
            <button
              type="button"
              className="btn-danger"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer mon compte
            </button>
          ) : (
            <div className="danger-confirm">
              <p className="danger-confirm-text">
                Es-tu sûr ? Tu seras déconnecté immédiatement.
              </p>
              <div className="danger-confirm-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deletingAccount}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  {deletingAccount && <LoaderCircle className="w-4 h-4 animate-spin" />}
                  Confirmer la suppression
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
