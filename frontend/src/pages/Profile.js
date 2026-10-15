/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Página "O meu perfil": qualquer utilizador autenticado pode ver os seus
 * dados e mudar a sua própria password (com confirmação da password atual).
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const roleLabels = {
  resident: "Residente",
  assembly: "Assembleia",
  admin: "Administrador",
  president: "Presidente"
};

export default function Profile() {
  const { user, checkingSession } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (checkingSession) return;
    if (!user) {
      navigate("/login");
      return;
    }
    axios.get("http://localhost:4000/api/auth/profile", { withCredentials: true })
      .then(res => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user, checkingSession, navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 6) {
      setError("A nova password deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As novas passwords não coincidem.");
      return;
    }
    setSaving(true);
    try {
      await axios.post("http://localhost:4000/api/auth/change-password", {
        currentPassword,
        newPassword
      }, { withCredentials: true });
      setSuccess("Password atualizada com sucesso.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao atualizar password.");
    } finally {
      setSaving(false);
    }
  };

  if (checkingSession || loading) {
    return <div className="page"><p>A carregar perfil...</p></div>;
  }

  return (
    <div className="page-narrow">
      <h1 style={{ marginBottom: "1.5rem" }}>O meu perfil</h1>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Dados da conta</h2>
        <p style={{ margin: "0.4rem 0" }}><strong>Nome:</strong> {profile?.name}</p>
        <p style={{ margin: "0.4rem 0" }}><strong>Email:</strong> {profile?.email}</p>
        <p style={{ margin: "0.4rem 0" }}><strong>Função:</strong> {roleLabels[profile?.role] || profile?.role}</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Alterar password</h2>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="field">
            <label className="label">Password atual</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Nova password</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mín. 6 caracteres"
              required
            />
          </div>
          <div className="field">
            <label className="label">Confirmar nova password</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}
          {success && <p style={{ color: "#10b981", fontWeight: 600 }}>{success}</p>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "A guardar..." : "Guardar nova password"}
          </button>
        </form>
      </div>
    </div>
  );
}
