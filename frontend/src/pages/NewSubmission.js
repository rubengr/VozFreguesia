import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function NewSubmission() {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [anonymous, setAnonymous] = useState(!user);
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [authorEmail, setAuthorEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Título e descrição são obrigatórios.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('anonymous', anonymous);
      if (!anonymous) {
        form.append('authorName', authorName);
        form.append('authorEmail', authorEmail);
      }
      Array.from(files).forEach(f => form.append('attachments', f));
      await axios.post("http://localhost:4000/api/submissions/new", form, { withCredentials: true });
      navigate("/");
    } catch {
      setError("Erro ao enviar submissão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      maxWidth: 700,
      padding: "2rem",
      margin: "2rem auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#fefefe",
      boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
      borderRadius: 8,
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    }}>
      <h1 style={{ borderBottom: "3px solid #2563eb", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
        Nova Submissão
      </h1>

      <label style={{ display: "flex", flexDirection: "column", fontWeight: "600" }}>
        Título:
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{ padding: 10, fontSize: "1rem", borderRadius: 6, border: "1px solid #ccc" }}
          placeholder="Digite o título da sua submissão"
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", fontWeight: "600" }}>
        Descrição:
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          rows={6}
          style={{ padding: 10, fontSize: "1rem", borderRadius: 6, border: "1px solid #ccc", resize: "vertical" }}
          placeholder="Descreva detalhadamente a sua questão, sugestão ou reclamação"
        />
      </label>

      <label style={{ fontWeight: "600" }}>
        Anexar arquivos (máx. 3 arquivos, JPG/PNG/PDF/DOCX, até 10MB cada):
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.docx"
          onChange={e => setFiles([...e.target.files])}
          style={{ marginTop: 6 }}
        />
      </label>

      {user && (
        <label style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={e => setAnonymous(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          Submissão anónima
        </label>
      )}

      {user && !anonymous && (
        <>
          <label style={{ display: "flex", flexDirection: "column", fontWeight: "600" }}>
            Nome:
            <input
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Seu nome"
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
              readOnly
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontWeight: "600" }}>
            Email:
            <input
              value={authorEmail}
              onChange={e => setAuthorEmail(e.target.value)}
              type="email"
              placeholder="Seu email - usado apenas para notificações"
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
              readOnly
            />
          </label>
        </>
      )}


      {error && <p style={{ color: "red", fontWeight: "600" }}>{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          backgroundColor: submitting ? "#93c5fd" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontSize: "1.1rem",
          fontWeight: "700",
          cursor: submitting ? "not-allowed" : "pointer",
          transition: "background-color 0.3s ease"
        }}
      >
        {submitting ? "Enviando..." : "Enviar submissão"}
      </button>
    </form>
  );
}
