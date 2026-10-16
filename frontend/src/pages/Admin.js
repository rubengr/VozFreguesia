/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Painel de administração de utilizadores (só acessível a "admin"): criar
 * contas de assembleia/presidente, listar todos os utilizadores, mudar o
 * papel de alguém (com um passo explícito de "Guardar") e repor passwords.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../config";

const roleLabels = {
  resident: "Residente",
  assembly: "Assembleia",
  admin: "Administrador",
  president: "Presidente"
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [updatingPasswordId, setUpdatingPasswordId] = useState(null);
  const currentUser = { email: "admin@admin.com", role: "admin" };
  const [pendingRoles, setPendingRoles] = useState({});
  const [savingRoleId, setSavingRoleId] = useState(null);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('assembly');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/admin/users`, { withCredentials: true })
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      });
  }, []);

  // Marca uma mudança de role como "pendente" (ainda não enviada ao servidor);
  // só é efetivamente aplicada quando se clica em "Guardar" (guardarRole)
  const selecionarRolePendente = (userId, novaRole) => {
    setPendingRoles({ ...pendingRoles, [userId]: novaRole });
  };

  const cancelarRolePendente = (userId) => {
    const copia = { ...pendingRoles };
    delete copia[userId];
    setPendingRoles(copia);
  };

  const guardarRole = (userId) => {
    const novaRole = pendingRoles[userId];
    if (!novaRole) return;
    setSavingRoleId(userId);
    axios.post(`${API_URL}/api/admin/set-role`, { userId, role: novaRole }, { withCredentials: true })
      .then(() => {
        setUsers(users.map(u => u._id === userId ? { ...u, role: novaRole } : u));
        cancelarRolePendente(userId);
        setSavingRoleId(null);
      })
      .catch(err => {
        alert(err.response?.data?.error || "Erro ao alterar role.");
        setSavingRoleId(null);
      });
  };

  const iniciarEdicaoSenha = (userId) => {
    setEditingUserId(userId);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  const cancelarEdicaoSenha = () => {
    setEditingUserId(null);
    setPasswordError(null);
  };

  const salvarSenha = (userId) => {
    if (newPassword.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setUpdatingPasswordId(userId);
    setPasswordError(null);

    axios.post(`${API_URL}/api/admin/change-password`, { userId, password: newPassword }, { withCredentials: true })
      .then(() => {
        alert("Senha atualizada com sucesso.");
        setEditingUserId(null);
        setUpdatingPasswordId(null);
      })
      .catch(() => {
        setPasswordError("Erro ao atualizar senha.");
        setUpdatingPasswordId(null);
      });
  };

  const criarUtilizador = (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || newUserPassword.length < 6) {
      setCreateUserError("Preencha nome e email, e use uma password com pelo menos 6 caracteres.");
      return;
    }
    setCreatingUser(true);
    setCreateUserError(null);
    axios.post(`${API_URL}/api/admin/create-user`, {
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole
    }, { withCredentials: true })
      .then(res => {
        setUsers([...users, res.data.user]);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('assembly');
        setCreatingUser(false);
      })
      .catch(err => {
        setCreateUserError(err.response?.data?.error || "Erro ao criar utilizador.");
        setCreatingUser(false);
      });
  };

  if (loading) return <div className="page"><p>Carregando usuários...</p></div>;

  return (
    <div className="page">
      <Link to="/" className="btn btn-outline btn-sm" style={{ marginBottom: "1rem" }}>
        Voltar ao Painel Inicial
      </Link>
      <h1 style={{ borderBottom: "2px solid var(--color-primary)", paddingBottom: 8, marginBottom: 20 }}>
        Administração de Utilizadores
      </h1>

      <form onSubmit={criarUtilizador} className="card" style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "flex-end",
        marginBottom: "1.5rem"
      }}>
        <div className="field" style={{ flex: "1 1 160px" }}>
          <label className="label">Nome</label>
          <input
            value={newUserName}
            onChange={e => setNewUserName(e.target.value)}
            placeholder="Nome completo"
            className="input"
          />
        </div>
        <div className="field" style={{ flex: "1 1 180px" }}>
          <label className="label">Email</label>
          <input
            type="email"
            value={newUserEmail}
            onChange={e => setNewUserEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="input"
          />
        </div>
        <div className="field" style={{ flex: "1 1 160px" }}>
          <label className="label">Password</label>
          <input
            type="password"
            value={newUserPassword}
            onChange={e => setNewUserPassword(e.target.value)}
            placeholder="Mín. 6 caracteres"
            className="input"
          />
        </div>
        <div className="field" style={{ flex: "0 1 150px" }}>
          <label className="label">Role</label>
          <select
            value={newUserRole}
            onChange={e => setNewUserRole(e.target.value)}
            className="input"
          >
            <option value="assembly">Assembleia</option>
            <option value="president">Presidente</option>
          </select>
        </div>
        <button type="submit" disabled={creatingUser} className="btn btn-primary">
          {creatingUser ? "A criar..." : "Criar utilizador"}
        </button>
        {createUserError && (
          <p className="error-text" style={{ width: "100%", margin: 0 }}>{createUserError}</p>
        )}
      </form>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--color-border)", backgroundColor: "var(--color-bg)" }}>
              <th style={{ padding: "12px 16px" }}>Nome</th>
              <th style={{ padding: "12px 16px" }}>Email</th>
              <th style={{ padding: "12px 16px" }}>Role</th>
              <th style={{ padding: "12px 16px" }}>Alterar Role</th>
              <th style={{ padding: "12px 16px" }}>Alterar Senha</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "12px 16px" }}>{u.name}</td>
                <td style={{ padding: "12px 16px" }}>{u.email}</td>
                <td style={{ padding: "12px 16px" }}>{roleLabels[u.role] || u.role}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <select value={pendingRoles[u._id] ?? u.role}
                            onChange={e => selecionarRolePendente(u._id, e.target.value)}
                            disabled={u.email === currentUser.email || savingRoleId === u._id}
                            className="input"
                            style={{ padding: "6px 8px" }}>
                      <option value="resident">Residente</option>
                      <option value="assembly">Assembleia</option>
                      <option value="admin">Administrador</option>
                      <option value="president">Presidente</option>
                    </select>
                    {pendingRoles[u._id] && pendingRoles[u._id] !== u.role && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => guardarRole(u._id)}
                          disabled={savingRoleId === u._id}
                          className="btn btn-primary btn-sm"
                        >
                          {savingRoleId === u._id ? "A guardar..." : "Guardar"}
                        </button>
                        <button
                          onClick={() => cancelarRolePendente(u._id)}
                          disabled={savingRoleId === u._id}
                          className="btn btn-outline btn-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: "12px 16px", minWidth: 280 }}>
                  {editingUserId === u._id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input
                        type="password"
                        placeholder="Nova senha"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        disabled={updatingPasswordId === u._id}
                        className="input"
                      />
                      <input
                        type="password"
                        placeholder="Confirmar nova senha"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        disabled={updatingPasswordId === u._id}
                        className="input"
                      />
                      {passwordError && <small className="error-text">{passwordError}</small>}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => salvarSenha(u._id)}
                          disabled={updatingPasswordId === u._id}
                          className="btn btn-primary btn-sm"
                        >
                          {updatingPasswordId === u._id ? "Atualizando..." : "Salvar"}
                        </button>
                        <button
                          onClick={cancelarEdicaoSenha}
                          disabled={updatingPasswordId === u._id}
                          className="btn btn-danger btn-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => iniciarEdicaoSenha(u._id)}
                      className="btn btn-success btn-sm"
                    >
                      Alterar Senha
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
