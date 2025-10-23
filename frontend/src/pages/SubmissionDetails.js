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
  const { user } = useContext(AuthContext);
  const [sub, setSub] = useState(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:4000/api/submissions/${id}`)
      .then(res => {
        setSub(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar submissão");
        setLoading(false);
      });
  }, [id]);

  const refresh = () => {
    axios.get(`http://localhost:4000/api/submissions/${id}`)
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

  const voteReject = async () => {
    await axios.post(`http://localhost:4000/api/submissions/${id}/admin-vote-reject`, {}, { withCredentials: true });
    refresh();
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: 50 }}>A carregar submissão...</div>;
  if (error) return <div style={{ color: "red", textAlign: "center", marginTop: 50 }}>{error}</div>;
  if (!sub) return <div style={{ textAlign: "center", marginTop: 50 }}>Submissão não encontrada.</div>;

  // Prepare os slides para imagens e vídeos para o Lightbox
  const slides = sub?.attachments.map(file => {
      const url = `http://localhost:4000/uploads/${file}`;
      const ext = file.split('.').pop().toLowerCase();
    
      if (["mp4", "webm", "ogg"].includes(ext)) {
        return {
          type: "video",
          width: 1280,    // ajustar se souber dimensões reais
          height: 720,
          sources: [
            { src: url, type: `video/${ext}` }
          ]
        };
      }
      // Para imagens, mantém simples:
      return { type: "image", src: url };
    }) || [];
      // Separar os arquivos que não serão exibidos na galeria para mostrar como links para download
      const filesForDownload = sub?.attachments
        .filter(file => {
          const ext = file.split('.').pop().toLowerCase();
          return !["mp4", "webm", "ogg", "jpg", "jpeg", "png", "gif", "webp"].includes(ext);
        }) || [];

      return (
        <div style={{
          maxWidth: 800,
          margin: "2rem auto",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          padding: "0 1rem",
          backgroundColor: "#fefefe",
          borderRadius: 8,
          boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
        }}>
          <h1 style={{ borderBottom: "2px solid #2563eb", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
            {sub.title}
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#333" }}>{sub.description}</p>
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

    {filesForDownload.length > 0 && (
      <div style={{ marginTop: 20 }}>
        <strong>Outros ficheiros:</strong>
        {filesForDownload.map(file => {
          const url = `http://localhost:4000/uploads/${file}`;
          return (
            <div key={file} style={{ marginTop: 10 }}>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>
                Ver/Descarregar {file}
              </a>
            </div>
          );
        })}
      </div>
    )}
     
      <p style={{ fontWeight: "600", marginTop: 10 }}>
        Status: <span style={{ color: {
          Pending: "#f59e0b",
          "In Progress": "#3b82f6",
          Resolved: "#10b981",
          Rejected: "#ef4444"
        }[sub.status] || "#777" }}>{sub.status}</span>
      </p>

      <section style={{ marginTop: 30 }}>
        <h2 style={{ borderBottom: "1px solid #ddd", paddingBottom: 6 }}>Histórico</h2>
        <ul style={{ paddingLeft: 20, maxHeight: 150, overflowY: "auto" }}>
          {sub.auditTrail.map((ev, i) =>
            <li key={i} style={{ marginBottom: 6, fontSize: 14, color: "#555" }}>
              {ev.action} por {ev.user} — <em>{new Date(ev.timestamp).toLocaleString()}</em>
            </li>
          )}
        </ul>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2 style={{ borderBottom: "1px solid #ddd", paddingBottom: 6 }}>Respostas</h2>
        {sub.replies.length === 0 && <p style={{ fontStyle: "italic", color: "#666" }}>Sem respostas ainda.</p>}
        {sub.replies.map((rep, i) =>
          <div key={i} style={{
            backgroundColor: rep.fromRole === "president" ? "#e0f2fe" : "#f0f4f8",
            padding: "0.5rem 1rem",
            borderRadius: 6,
            marginBottom: 10
          }}>
            <strong>{rep.fromRole === "president" ? "Presidente" : "Residente"}:</strong> {rep.text}
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {new Date(rep.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </section>

      {(user?.role === "president" || user?.role === "resident") && (
        <section style={{ marginTop: 30 }}>
          <h3>Adicionar resposta</h3>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            rows={4}
            placeholder="Escreva sua resposta aqui..."
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: 6,
              borderColor: "#ccc",
              fontSize: "1rem",
              resize: "vertical"
            }}
          />
          <button
            onClick={sendReply}
            disabled={!reply.trim()}
            style={{
              marginTop: 10,
              padding: "0.5rem 1.5rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: reply.trim() ? "pointer" : "not-allowed",
              fontWeight: "600"
            }}
          >
            {user.role === "president" ? "Responder como presidente" : "Responder ao presidente"}
          </button>
        </section>
      )}

      {user?.role === "president" && (
        <section style={{ marginTop: 30 }}>
          <h3>Alterar status</h3>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ padding: "0.5rem", fontSize: "1rem", borderRadius: 6, borderColor: "#ccc" }}
          >
            <option value="">Selecione um status</option>
            <option value="Pending">Pendente</option>
            <option value="In Progress">Em andamento</option>
            <option value="Resolved">Resolvida</option>
            <option value="Rejected">Rejeitada</option>
          </select>
          <button
            onClick={changeStatus}
            disabled={!status}
            style={{
              marginLeft: 10,
              padding: "0.5rem 1rem",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: status ? "pointer" : "not-allowed",
              fontWeight: "600"
            }}
          >
            Atualizar status
          </button>
        </section>
      )}

      {user?.role === "admin" && (
        <section style={{ marginTop: 30 }}>
          <button
            onClick={voteReject}
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "0.5rem 1rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Votar rejeição
          </button>
        </section>
      )}
    </div>
  );
}
