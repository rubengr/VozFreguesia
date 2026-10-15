/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Última etapa da recuperação de password: a pessoa chega aqui a partir do
 * link recebido por email (/reset-password/:token) e define uma password
 * nova, validada pelo backend contra o token guardado.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError("A password deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As passwords não coincidem.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("http://localhost:4000/api/auth/reset-password", { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao redefinir a password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-narrow">
      <div className="card">
        <h1 style={{ marginTop: 0, marginBottom: "1rem", textAlign: "center", color: "var(--color-primary)" }}>
          Definir nova password
        </h1>

        {success ? (
          <p style={{ color: "#10b981", fontWeight: 600, textAlign: "center" }}>
            Password atualizada com sucesso. A redirecionar para o login...
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="field">
              <label className="label">Nova password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                placeholder="Mín. 6 caracteres"
                className="input"
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label className="label">Confirmar nova password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="input"
                autoComplete="new-password"
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: "100%" }}>
              {submitting ? "A guardar..." : "Guardar nova password"}
            </button>

            <Link to="/login" style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--color-primary)" }}>
              Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
