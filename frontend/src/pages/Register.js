/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Página de registo público. Cria sempre uma conta de residente (fregues);
 * outros papéis só podem ser atribuídos depois por um administrador.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function Register() {
  const { login } = useContext(AuthContext); // Caso queira login imediato após registo
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Todos os campos são obrigatórios.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name, email, password
      });
      // Opcional: login automático após registo
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao registrar. Por favor tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-narrow">
      <form onSubmit={handleRegister} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem", textAlign: "center", color: "var(--color-primary)" }}>Criar Conta</h1>

        <div className="field">
          <label className="label">Nome</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Seu nome completo"
            className="input"
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Seu email"
            className="input"
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label className="label">Senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Senha"
            className="input"
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label className="label">Confirmar Senha</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
            required
            placeholder="Confirme a senha"
            className="input"
            autoComplete="new-password"
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: "100%" }}>
          {submitting ? "Registrando..." : "Registrar"}
        </button>
      </form>
    </div>
  );
}
