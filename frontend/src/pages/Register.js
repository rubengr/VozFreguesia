import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
      await axios.post("http://localhost:4000/api/auth/register", {
        name, email, password
      });
      // Opcional: login automático após registo
      await login(email, password);
      navigate("/");
    } catch {
      setError("Erro ao registrar. Por favor tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleRegister} style={{
      maxWidth: 400,
      margin: "4rem auto",
      padding: "2rem",
      boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
      borderRadius: 8,
      backgroundColor: "#fefefe",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    }}>
      <h1 style={{ marginBottom: "1.5rem", textAlign: "center", color: "#2563eb" }}>Criar Conta</h1>

      <label style={{ fontWeight: "600", display: "flex", flexDirection: "column" }}>
        Nome:
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          placeholder="Seu nome completo"
          style={{ padding: 10, fontSize: "1rem", borderRadius: 6, border: "1px solid #ccc" }}
          autoComplete="name"
        />
      </label>

      <label style={{ fontWeight: "600", display: "flex", flexDirection: "column" }}>
        Email:
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="Seu email"
          style={{ padding: 10, fontSize: "1rem", borderRadius: 6, border: "1px solid #ccc" }}
          autoComplete="email"
        />
      </label>

      <label style={{ fontWeight: "600", display: "flex", flexDirection: "column" }}>
        Senha:
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="Senha"
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          autoComplete="new-password"
        />
      </label>

      <label style={{ fontWeight: "600", display: "flex", flexDirection: "column" }}>
        Confirmar Senha:
        <input
          type="password"
          value={passwordConfirm}
          onChange={e => setPasswordConfirm(e.target.value)}
          required
          placeholder="Confirme a senha"
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          autoComplete="new-password"
        />
      </label>

      {error && <p style={{ color: "red", fontWeight: "600" }}>{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "0.75rem",
          fontWeight: "700",
          fontSize: "1.1rem",
          backgroundColor: submitting ? "#93c5fd" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: submitting ? "not-allowed" : "pointer",
          transition: "background-color 0.3s ease"
        }}
      >
        {submitting ? "Registrando..." : "Registrar"}
      </button>
    </form>
  );
}
