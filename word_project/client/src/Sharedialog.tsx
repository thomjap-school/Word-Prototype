import { useState, type SyntheticEvent } from "react";
import { X, Link2, Mail, LoaderCircle, Check, UserX } from "lucide-react";
import {
  inviteCollaborator,
  removeCollaborator,
  generateShareLink,
  type Collaborator,
} from "./documentService";

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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Partager le document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleInvite} className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-3 rounded-md transition-colors"
          >
            {inviting && <LoaderCircle className="w-4 h-4 animate-spin" />}
            Inviter
          </button>
        </form>
        {inviteError && (
          <p className="text-sm text-red-600 mb-3">{inviteError}</p>
        )}

        <button
          onClick={handleCopyLink}
          disabled={generatingLink}
          className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 py-2 rounded-md transition-colors mb-4"
        >
          {generatingLink ? (
            <LoaderCircle className="w-4 h-4 animate-spin" />
          ) : linkCopied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
          {linkCopied ? "Lien copié !" : "Copier le lien de partage"}
        </button>
        {linkError && (
          <p className="text-sm text-red-600 mb-3 -mt-3">{linkError}</p>
        )}

        {collaborators.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Collaborateurs
            </p>
            <div className="flex flex-col gap-1">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-sm text-gray-700 px-1 py-1"
                >
                  <span className="truncate">{c.full_name || c.email}</span>
                  <button
                    onClick={() => handleRemove(c.id)}
                    title="Retirer"
                    className="text-gray-400 hover:text-red-500 shrink-0"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
