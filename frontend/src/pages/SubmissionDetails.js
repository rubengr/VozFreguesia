/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Página de detalhe de uma submissão: descrição, galeria de anexos,
 * histórico de auditoria, respostas, e as ações disponíveis consoante o
 * papel de quem está a ver (responder, alterar estado, propor/cancelar/
 * confirmar rejeição).
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useParams } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Inline from "yet-another-react-lightbox/plugins/inline";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Video from "yet-another-react-lightbox/plugins/video";

export default function SubmissionDetails() {
  const { id } = useParams();
  const { user, refreshPendingRejections } = useContext(AuthContext);
  const [sub, setSub] = useState(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:4000/api/submissions/${id}`, { withCredentials: true })
      .then(res => {
        setSub(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(
          err.response?.status === 404
            ? "Submissão não encontrada (pode ter sido rejeitada e está oculta para o seu papel)."
            : "Erro ao carregar submissão"
        );
        setLoading(false);
      });
  }, [id]);

  const refresh = () => {
    axios.get(`http://localhost:4000/api/submissions/${id}`, { withCredentials: true })
      .then(res => setSub(res.data))
      .catch(() => setError("Erro ao atualizar submissão"));
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    await axios.post(`http://localhost:4000/api/submissions/${id}/reply`, { text: reply }, { withCredentials: true });
    setReply('');
    refresh();
  };

  const changeStatus = async () => {
    if (!status) return;
    await axios.post(`http://localhost:4000/api/submissions/${id}/status`, { status }, { withCredentials: true });
    setStatus('');
    refresh();
  };

  // Confirma (vota) a proposta de rejeição em curso; depois de guardar,
  // atualiza também o sininho de notificações na navbar.
  const voteReject = async () => {
    await axios.post(`http://localhost:4000/api/submissions/${id}/admin-vote-reject`, {}, { withCredentials: true });
    refresh();
    refreshPendingRejections();
  };

  // Presidente propõe a rejeição desta submissão (fica à espera da assembleia)
  const proporRejeicao = async () => {
    await axios.post(`http://localhost:4000/api/submissions/${id}/propose-rejection`, {}, { withCredentials: true });
    refresh();
    refreshPendingRejections();
  };

  // Presidente desiste da proposta de rejeição antes de ser confirmada
  const cancelarProposta = async () => {
    await axios.post(`http://localhost:4000/api/submissions/${id}/cancel-rejection-proposal`, {}, { withCredentials: true });
    refresh();
    refreshPendingRejections();
  };

  if (loading) return <div className="page" style={{ textAlign: "center" }}>A carregar submissão...</div>;
  if (error) return <div className="page error-text" style={{ textAlign: "center" }}>{error}</div>;
  if (!sub) return <div className="page" style={{ textAlign: "center" }}>Submissão não encontrada.</div>;

  // Prepare os slides para imagens e vídeos para o Lightbox
  const mediaExtensions = ["mp4", "webm", "ogg", "jpg", "jpeg", "png", "gif", "webp"];
  const slides = sub?.attachments
    .filter(file => mediaExtensions.includes(file.split('.').pop().toLowerCase()))
    .map(file => {
      const url = `http://localhost:4000/uploads/${file}`;
      const ext = file.split('.').pop().toLowerCase();

      if (["mp4", "webm", "ogg"].includes(ext)) {
        return {
          type: "video",
          width: 1280,
          height: 720,
          sources: [{ src: url, type: `video/${ext}` }],
        };
      }
      // Caso contrário, imagem
      return { type: "image", src: url };
    }) || [];
  // Separar os arquivos que não serão exibidos na galeria para mostrar como links para download
  const filesForDownload = sub?.attachments
    .filter(file => !mediaExtensions.includes(file.split('.').pop().toLowerCase()))
    .map(file => `http://localhost:4000/uploads/${file}`) || [];

  // Só chamamos "resposta ao presidente" se o presidente já tiver participado nesta submissão
  const presidentReplied = sub.replies.some(rep => rep.fromRole === "president");

  // Texto do botão de resposta, adaptado a quem está a responder e ao
  // contexto da conversa (evita dizer "responder ao presidente" quando ele
  // ainda nem participou)
  const replyButtonLabel = () => {
    if (user.role === "president") return "Responder como presidente";
    return presidentReplied ? "Responder ao presidente" : "Adicionar comentário";
  };

  return (
    <div className="page">
      <div className="card">
        <h1 style={{ marginTop: 0, borderBottom: "2px solid var(--color-border)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
          {sub.title}
        </h1>
        <p style={{ fontSize: "1.05rem", color: "#334155" }}>{sub.description}</p>
        {slides.length > 0 && (
          <Lightbox
            open={open}
            close={() => setOpen(false)}
            slides={slides}
            plugins={[Inline, Fullscreen, Video]}
            inline={{
              style: {
                width: "100%",
                height: "80vh",
                maxWidth: "960px",
                margin: "auto",
              }
            }}
          />
        )}

        {filesForDownload.map((url, i) => (
          <div key={i} style={{ marginTop: 10 }}>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                Ver/Descarregar ficheiro {i + 1}
            </a>
          </div>
        ))}

        <p style={{ fontWeight: 600, marginTop: 14 }}>
          Status:{" "}
          <span className="badge" style={{
            backgroundColor: {
              Pending: "#f59e0b",
              "In Progress": "#3b82f6",
              Resolved: "#10b981",
              Rejected: "#ef4444"
            }[sub.status] || "#777"
          }}>{sub.status}</span>
        </p>

        {/* Aviso visível a quem conseguiu mesmo assim abrir uma submissão rejeitada */}
        {sub.status === "Rejected" && (
          <p style={{
            fontSize: "0.85rem",
            color: "#991b1b",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "0.6rem 0.9rem"
          }}>
            Esta submissão foi rejeitada pela assembleia e está oculta do público — só é visível para presidente, administradores e membros da assembleia.
          </p>
        )}

        {/* Notificação da proposta de rejeição em curso, só para quem gere a freguesia */}
        {sub.status === "Pending" && sub.rejectionProposedBy && ["president", "admin", "assembly"].includes(user?.role) && (
          <p style={{
            fontSize: "0.85rem",
            color: "#92400e",
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 8,
            padding: "0.6rem 0.9rem"
          }}>
            ⚠ O presidente ({sub.rejectionProposedBy}) propôs a rejeição desta submissão
            {" "}em {new Date(sub.rejectionProposedAt).toLocaleString()}. Pede-se avaliação e confirmação dos membros da assembleia.
          </p>
        )}

        <section style={{ marginTop: 30 }}>
          <h2 style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 6, fontSize: "1.1rem" }}>Histórico</h2>
          <ul style={{ paddingLeft: 20, maxHeight: 150, overflowY: "auto" }}>
            {sub.auditTrail.map((ev, i) =>
              <li key={i} style={{ marginBottom: 6, fontSize: 14, color: "#555" }}>
                {ev.action} por {ev.user} — <em>{new Date(ev.timestamp).toLocaleString()}</em>
              </li>
            )}
          </ul>
        </section>

        <section style={{ marginTop: 30 }}>
          <h2 style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 6, fontSize: "1.1rem" }}>Respostas</h2>
          {sub.replies.length === 0 && <p style={{ fontStyle: "italic", color: "#666" }}>Sem respostas ainda.</p>}
          {sub.replies.map((rep, i) =>
            <div key={i} style={{
              backgroundColor: rep.fromRole === "president" ? "#e0f2fe" : "#f0f4f8",
              padding: "0.6rem 1rem",
              borderRadius: 8,
              marginBottom: 10
            }}>
              <strong>{rep.authorName || (rep.fromRole === "president" ? "Presidente" : "Residente")}</strong>
              {" "}
              <span style={{ fontSize: 12, color: "#64748b" }}>
                ({rep.fromRole === "president" ? "Presidente" : "Residente"})
              </span>
              <div>{rep.text}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {new Date(rep.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </section>

        {(user?.role === "president" || user?.role === "resident") && (
          <section style={{ marginTop: 30 }}>
            <h3 style={{ fontSize: "1rem" }}>Adicionar resposta</h3>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={4}
              placeholder="Escreva sua resposta aqui..."
              className="input"
              style={{ resize: "vertical" }}
            />
            <button
              onClick={sendReply}
              disabled={!reply.trim()}
              className="btn btn-primary"
              style={{ marginTop: 10 }}
            >
              {replyButtonLabel()}
            </button>
          </section>
        )}

        {user?.role === "president" && (
          <section style={{ marginTop: 30 }}>
            <h3 style={{ fontSize: "1rem" }}>Alterar status</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="input"
                style={{ maxWidth: 220 }}
              >
                <option value="">Selecione um status</option>
                <option value="Pending">Pendente</option>
                <option value="In Progress">Em andamento</option>
                <option value="Resolved">Resolvida</option>
              </select>
              <button
                onClick={changeStatus}
                disabled={!status}
                className="btn btn-success"
              >
                Atualizar status
              </button>
            </div>
          </section>
        )}

        {/* Ações de rejeição do presidente: propor (se ainda não há proposta) ou cancelar */}
        {user?.role === "president" && sub.status === "Pending" && (
          <section style={{ marginTop: 30 }}>
            <h3 style={{ fontSize: "1rem" }}>Rejeição</h3>
            {sub.rejectionProposedBy ? (
              <button onClick={cancelarProposta} className="btn btn-outline">
                Cancelar proposta de rejeição
              </button>
            ) : (
              <button onClick={proporRejeicao} className="btn btn-danger">
                Propor rejeição
              </button>
            )}
          </section>
        )}

        {/* Confirmação da assembleia: só aparece se o presidente já tiver proposto */}
        {user?.role === "assembly" && sub.status === "Pending" && sub.rejectionProposedBy && (
          <section style={{ marginTop: 30 }}>
            <button
              onClick={voteReject}
              className="btn btn-danger"
            >
              Confirmar rejeição
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
