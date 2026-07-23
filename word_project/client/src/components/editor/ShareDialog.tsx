import { useState, type SyntheticEvent } from "react";
import { X, Link2, Mail, LoaderCircle, Check, UserX } from "lucide-react";
import {
  inviteCollaborator,
  removeCollaborator,
  generateShareLink,
  type Collaborator,
} from "../../services/documentService";

interface ShareDialogProps {
  documentId: number;
  collaborators: Collaborator[];
  onClose: () => void;
  onCollaboratorsChange: (collaborators: Collaborator[]) => void;
}

export default function ShareDialog({
  documentId,
  collaborators,
  onClose,
  onCollaboratorsChange,
}: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleInvite = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteError(null);
    setInviting(true);
    try {
      const doc = await inviteCollaborator(documentId, email);
      onCollaboratorsChange(doc.collaborators);
      setEmail("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Échec de l'invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: number) => {
    const doc = await removeCollaborator(documentId, userId);
    onCollaboratorsChange(doc.collaborators);
  };

  const handleCopyLink = async () => {
    setLinkError(null);
    setGeneratingLink(true);
    try {
      const link = await generateShareLink(documentId);
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Échec de la génération du lien");
    } finally {
      setGeneratingLink(false);
    }
  };

  return (
    <div className="share-overlay">
      <div className="share-modal">
        <div className="share-modal-header">
          <h2 className="share-modal-title">Partager le document</h2>
          <button onClick={onClose} className="share-modal-close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleInvite} className="share-invite-form">
          <div className="input-wrap flex-1">
            <Mail className="input-icon" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="form-input"
            />
          </div>
          <button type="submit" disabled={inviting} className="share-invite-btn">
            {inviting && <LoaderCircle className="w-4 h-4 animate-spin" />}
            Inviter
          </button>
        </form>
        {inviteError && <p className="share-error">{inviteError}</p>}

        <button onClick={handleCopyLink} disabled={generatingLink} className="share-link-btn">
          {generatingLink ? (
            <LoaderCircle className="w-4 h-4 animate-spin" />
          ) : linkCopied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
          {linkCopied ? "Lien copié !" : "Copier le lien de partage"}
        </button>
        {linkError && <p className="share-link-error">{linkError}</p>}

        <div className="share-collab-section">
          <p className="share-collab-label">Collaborateurs</p>
          {collaborators.length > 0 ? (
            <div className="share-collab-list">
              {collaborators.map((c) => (
                <div key={c.id} className="share-collab-item">
                  <span className="truncate">{c.full_name || c.email}</span>
                  <button
                    onClick={() => handleRemove(c.id)}
                    title="Retirer"
                    className="share-collab-remove"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Personne d'autre n'a encore accès.</p>
          )}
        </div>
      </div>
    </div>
  );
}
