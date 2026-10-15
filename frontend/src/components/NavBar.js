/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Barra de navegação, visível em todas as páginas: logótipo, atalhos
 * principais, e a zona do utilizador (nome, papel, sininho de notificações
 * para a assembleia, link de perfil e logout) ou os links de login/registo.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

// Rótulos e cores em português para cada papel, reutilizados noutras páginas
const roleLabels = {
  resident: "Residente",
  assembly: "Assembleia",
  admin: "Administrador",
  president: "Presidente"
};

const roleColors = {
  resident: "#64748b",
  assembly: "#8b5cf6",
  admin: "#2563eb",
  president: "#10b981"
};

export default function NavBar() {
  const { user, logout, checkingSession, pendingRejections } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">Voz da Freguesia</Link>

      <nav className="navbar-links">
        <Link to="/new" className="navbar-link">Nova submissão</Link>
        <Link to="/stats" className="navbar-link">Estatísticas</Link>
        {user?.role === "admin" && (
          <Link to="/admin" className="navbar-link">Painel de administração</Link>
        )}
      </nav>

      <div className="navbar-user">
        {!checkingSession && (user ? (
          <>
            {/* Sininho de notificações: só visível à assembleia, mostra quantas
                propostas de rejeição do presidente este membro ainda não confirmou */}
            {user.role === "assembly" && (
              <Link
                to="/"
                className="navbar-link"
                title={pendingRejections > 0
                  ? `${pendingRejections} proposta(s) de rejeição por confirmar`
                  : "Sem propostas de rejeição por confirmar"}
                style={{ position: "relative", fontSize: "1.1rem" }}
              >
                🔔
                {pendingRejections > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    backgroundColor: "#ef4444",
                    color: "white",
                    borderRadius: "50%",
                    minWidth: 16,
                    height: 16,
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                    lineHeight: 1
                  }}>
                    {pendingRejections}
                  </span>
                )}
              </Link>
            )}
            <span>
              {user.name}{" "}
              <span className="badge" style={{ backgroundColor: roleColors[user.role] || "#64748b" }}>
                {roleLabels[user.role] || user.role}
              </span>
            </span>
            <Link to="/profile" className="navbar-link">O meu perfil</Link>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">Sair</button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Registar</Link>
          </>
        ))}
      </div>
    </header>
  );
}

export { roleLabels, roleColors };
