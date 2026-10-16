/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Pedido de recuperação de password ("esqueci-me da password"). A resposta
 * do backend é sempre genérica, por desenho, para não revelar que emails
 * estão registados na aplicação.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../config";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setMessage(res.data.message || "Se o email existir, foi enviado um link de recuperação.");
    } catch {
      setError("Erro ao pedir recuperação de password. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-narrow">
      <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem", textAlign: "center", color: "var(--color-primary)" }}>
          Recuperar password
        </h1>
        <p style={{ marginTop: 0, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Indique o email da sua conta. Se existir, enviamos um link para definir uma nova password.
        </p>

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

        {error && <p className="error-text">{error}</p>}
        {message && <p style={{ color: "#10b981", fontWeight: 600 }}>{message}</p>}

        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: "100%" }}>
          {submitting ? "A enviar..." : "Enviar link de recuperação"}
        </button>

        <Link to="/login" style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--color-primary)" }}>
          Voltar ao login
        </Link>
      </form>
    </div>
  );
}
