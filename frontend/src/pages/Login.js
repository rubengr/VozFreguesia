import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
    <form onSubmit={handleLogin} style={{
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
      <h1 style={{ marginBottom: "1.5rem", textAlign: "center", color: "#2563eb" }}>Entrar</h1>

      <label style={{ fontWeight: "600", display: "flex", flexDirection: "column" }}>
        Email:
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="Seu email"
          style={{ padding: 10, fontSize: "1rem", borderRadius: 6, border: "1px solid #ccc" }}
          autoComplete="username"
        />
      </label>

      <label style={{ fontWeight: "600", display: "flex", flexDirection: "column" }}>
        Senha:
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="Sua senha"
          style={{ padding: 10, fontSize: "1rem", borderRadius: 6, border: "1px solid #ccc" }}
          autoComplete="current-password"
        />
      </label>

      {error && <p style={{ color: "red", fontWeight: "600" }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "0.75rem",
          fontWeight: "700",
          fontSize: "1.1rem",
          backgroundColor: loading ? "#93c5fd" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.3s ease"
        }}
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
