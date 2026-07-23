import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";

/** Déconnecte l'utilisateur puis redirige vers la page de connexion. */
export function useLogout() {
  const navigate = useNavigate();
  return useCallback(() => {
    logout();
    navigate("/login");
  }, [navigate]);
}
