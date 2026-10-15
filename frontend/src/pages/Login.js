/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Página de login. Delega a autenticação propriamente dita ao AuthContext.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Falha no login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-narrow">
      <form onSubmit={handleLogin} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem", textAlign: "center", color: "var(--color-primary)" }}>Entrar</h1>

        <div className="field">
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Seu email"
            className="input"
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label className="label">Senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Sua senha"
            className="input"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <Link to="/forgot-password" style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--color-primary)" }}>
          Esqueci-me da password
        </Link>
      </form>
    </div>
  );
}
