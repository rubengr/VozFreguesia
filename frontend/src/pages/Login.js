import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      alert("Login falhou");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <label>Email <input value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label>Senha <input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
      <button type="submit">Entrar</button>
    </form>
  );
}
