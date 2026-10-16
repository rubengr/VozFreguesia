/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Contexto global de autenticação: quem está logado, funções de
 * login/logout, e a contagem de propostas de rejeição por confirmar (usada
 * pelo sininho de notificações da navbar, só relevante para a assembleia).
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Enquanto `checkingSession` é true, ainda não sabemos se há sessão válida
  // (evita mostrar por breves instantes o estado "deslogado" a quem está logado)
  const [checkingSession, setCheckingSession] = useState(true);
  const [pendingRejections, setPendingRejections] = useState(0);

  /**
   * Recalcula quantas propostas de rejeição do presidente ainda faltam ser
   * confirmadas por ESTE utilizador (só se aplica a membros da assembleia).
   * Aceita opcionalmente o utilizador a usar, para poder ser chamada logo a
   * seguir a um login/refresh, antes do estado `user` ainda estar atualizado.
   */
  const refreshPendingRejections = useCallback((currentUser) => {
    const u = currentUser !== undefined ? currentUser : user;
    if (!u || u.role !== "assembly") {
      setPendingRejections(0);
      return;
    }
    axios.get(`${API_URL}/api/submissions/all`, { withCredentials: true })
      .then(res => {
        const count = res.data.filter(s =>
          s.status === "Pending" &&
          s.rejectionProposedBy &&
          // só conta as que este membro específico ainda não confirmou
          !s.votesToReject.some(v => String(v.adminId) === String(u.id))
        ).length;
        setPendingRejections(count);
      })
      .catch(() => {});
  }, [user]);

  // Ao carregar a aplicação, pergunta ao backend se o cookie de sessão
  // (se existir) ainda é válido, para restaurar a sessão sem precisar de
  // fazer login outra vez a cada refresh da página.
  useEffect(() => {
    axios.get(`${API_URL}/api/auth/me`, { withCredentials: true })
      .then(res => {
        const loadedUser = { id: res.data.id, name: res.data.name, role: res.data.role, email: res.data.email };
        setUser(loadedUser);
        refreshPendingRejections(loadedUser);
      })
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password }, { withCredentials: true });
    const loadedUser = { id: res.data.id, email: res.data.email, role: res.data.role, name: res.data.name };
    setUser(loadedUser);
    refreshPendingRejections(loadedUser);
  };
  const logout = async () => {
    await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    setUser(null);
    setPendingRejections(0);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, checkingSession, pendingRejections, refreshPendingRejections }}>
      {children}
    </AuthContext.Provider>
  );
}
