/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Página inicial: lista pública de submissões, com filtro por estado. O
 * backend já exclui as rejeitadas para quem não tem privilégio (esta
 * página só decide se MOSTRA o botão de filtro "Rejeitada").
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

// Só quem gere a freguesia (não um residente comum) vê submissões rejeitadas
const PRIVILEGED_ROLES = ["president", "admin", "assembly"];

export default function SubmissionsList() {
  const { user } = useContext(AuthContext);
  const [subs, setSubs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const podeVerRejeitadas = user && PRIVILEGED_ROLES.includes(user.role);

  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:4000/api/submissions/all", { withCredentials: true })
      .then(res => {
        setSubs(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar submissões");
        setLoading(false);
      });
  }, []);

  // Tradução dos estados para português
  const statusLabels = {
    'Pending': 'Pendente',
    'In Progress': 'Em progresso',
    'Resolved': 'Resolvida',
    'Rejected': 'Rejeitada',
  };

  const statusColors = {
    'Pending': '#f59e0b',      // Amarelo
    'In Progress': '#3b82f6',  // Azul
    'Resolved': '#10b981',     // Verde
    'Rejected': '#ef4444'      // Vermelho
  };

  const filtered = filter === "all" ? subs : subs.filter(s => s.status === filter);

  return (
    <div className="page">
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Voz da Freguesia</h1>

      <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["all", "Pending", "In Progress", "Resolved", ...(podeVerRejeitadas ? ["Rejected"] : [])].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className="btn btn-sm"
            style={{
              border: "2px solid",
              borderColor: filter === status ? "#2563eb" : "#e2e8f0",
              backgroundColor: filter === status ? "#2563eb" : "white",
              color: filter === status ? "white" : "#334155",
              minWidth: 90
            }}
          >
            {status === "all" ? "Todas" : statusLabels[status]}
          </button>
        ))}
      </div>

      {loading && <p style={{ textAlign: "center" }}>A carregar submissões...</p>}
      {error && <p className="error-text" style={{ textAlign: "center" }}>{error}</p>}

      {!loading && filtered.length === 0 && (
        <p style={{ textAlign: "center", fontStyle: "italic", color: "#64748b" }}>
          Nenhuma submissão encontrada para o filtro selecionado.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map(sub => (
          <Link
            to={`/submission/${sub._id}`}
            key={sub._id}
            className="card"
            style={{
              textDecoration: "none",
              color: "#111",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "box-shadow 0.2s ease, transform 0.1s ease"
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow)"; }}
          >
            <div>
              <h3 style={{ margin: 0 }}>{sub.title}</h3>
              <p style={{ margin: "0.25rem 0", fontWeight: 600, color: "#64748b", fontSize: "0.9rem" }}>
                Criado a {new Date(sub.createdAt).toLocaleString()}
              </p>
              {/* Sinaliza, só a quem tem privilégio, as submissões com proposta
                  de rejeição do presidente ainda por confirmar */}
              {sub.status === "Pending" && sub.rejectionProposedBy && podeVerRejeitadas && (
                <p style={{ margin: "0.25rem 0 0", fontWeight: 600, color: "#92400e", fontSize: "0.8rem" }}>
                  ⚠ Rejeição proposta pelo presidente — aguarda confirmação da assembleia
                </p>
              )}
            </div>
            <span className="badge" style={{ backgroundColor: statusColors[sub.status] || "#999" }}>
              {statusLabels[sub.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
