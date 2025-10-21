import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";  

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [updatingPasswordId, setUpdatingPasswordId] = useState(null);
  const currentUser = { email: "admin@admin.com", role: "admin" };

  useEffect(() => {
    axios.get("http://localhost:4000/api/admin/users", { withCredentials: true })
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      });
  }, []);

  const alterarRole = (userId, novaRole) => {
    axios.post("http://localhost:4000/api/admin/set-role", { userId, role: novaRole }, { withCredentials: true })
      .then(() => {
        setUsers(users.map(u => u._id === userId ? { ...u, role: novaRole } : u));
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

    axios.post("http://localhost:4000/api/admin/change-password", { userId, password: newPassword }, { withCredentials: true })
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

  if (loading) return <p>Carregando usuários...</p>;

  return (
    
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <Link
        to="/"
        style={{
          display: "inline-block",
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: 6,
          textDecoration: "none",
          fontWeight: "600",
          cursor: "pointer"
        }}
      >
        Voltar ao Painel Inicial
      </Link>
      <h2 style={{ borderBottom: "2px solid #2563eb", paddingBottom: 8, marginBottom: 16 }}>Administração de Usuários</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
            <th style={{ padding: "8px" }}>Nome</th>
            <th style={{ padding: "8px" }}>Email</th>
            <th style={{ padding: "8px" }}>Role</th>
            <th style={{ padding: "8px" }}>Alterar Role</th>
            <th style={{ padding: "8px" }}>Alterar Senha</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px" }}>{u.name}</td>
              <td style={{ padding: "8px" }}>{u.email}</td>
              <td style={{ padding: "8px", textTransform: "capitalize" }}>{u.role}</td>
              <td style={{ padding: "8px" }}>
                <select value={u.role} 
                        onChange={e => alterarRole(u._id, e.target.value)} 
                        disabled={u.email === currentUser.email}
                        style={{ padding: 6, borderRadius: 4 }}>
                  <option value="resident">Residente</option>
                  <option value="admin">Admin</option>
                  <option value="president">Presidente</option>
                </select>
              </td>
              <td style={{ padding: "8px", minWidth: 280 }}>
                {editingUserId === u._id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <input
                      type="password"
                      placeholder="Nova senha"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      disabled={updatingPasswordId === u._id}
                      style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
                    />
                    <input
                      type="password"
                      placeholder="Confirmar nova senha"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={updatingPasswordId === u._id}
                      style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
                    />
                    {passwordError && <small style={{ color: "red" }}>{passwordError}</small>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => salvarSenha(u._id)}
                        disabled={updatingPasswordId === u._id}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#2563eb",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer"
                        }}
                      >
                        {updatingPasswordId === u._id ? "Atualizando..." : "Salvar"}
                      </button>
                      <button
                        onClick={cancelarEdicaoSenha}
                        disabled={updatingPasswordId === u._id}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer"
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => iniciarEdicaoSenha(u._id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer"
                    }}
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
  );
}
