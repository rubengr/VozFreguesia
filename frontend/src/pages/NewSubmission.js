/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Formulário de criação de uma nova submissão. Se o utilizador estiver
 * autenticado, nome/email vêm automaticamente da conta (só editáveis ao
 * desativar o anonimato); sem sessão, a submissão é sempre anónima.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function NewSubmission() {
  const { user, checkingSession } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Só decidimos o valor por omissão do anónimo depois de sabermos se há sessão ativa
  useEffect(() => {
    if (!checkingSession) setAnonymous(!user);
  }, [checkingSession, user]);

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
      if (!anonymous && user) {
        form.append('authorName', user.name);
        form.append('authorEmail', user.email);
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

  if (checkingSession) {
    return <div className="page"><p>A carregar...</p></div>;
  }

  return (
    <div className="page-narrow" style={{ maxWidth: 640 }}>
      <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h1 style={{ marginTop: 0, borderBottom: "3px solid var(--color-primary)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
          Nova Submissão
        </h1>

        <div className="field">
          <label className="label">Título</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="input"
            placeholder="Digite o título da sua submissão"
          />
        </div>

        <div className="field">
          <label className="label">Descrição</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={6}
            className="input"
            style={{ resize: "vertical" }}
            placeholder="Descreva detalhadamente a sua questão, sugestão ou reclamação"
          />
        </div>

        <div className="field">
          <label className="label">Anexar arquivos (máx. 10 arquivos, JPG/PNG/PDF/DOCX, até 10MB cada)</label>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.docx"
            onChange={e => setFiles([...e.target.files])}
          />
        </div>

        {user && (
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
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
            <div className="field">
              <label className="label">Nome</label>
              <input value={user.name} className="input" readOnly />
            </div>
            <div className="field">
              <label className="label">Email</label>
              <input value={user.email} type="email" className="input" readOnly />
            </div>
          </>
        )}

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: "100%" }}>
          {submitting ? "Enviando..." : "Enviar submissão"}
        </button>
      </form>
    </div>
  );
}
