import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import axios from "axios";

export default function SubmissionsList() {
  const { user } = useContext(AuthContext);
  const [subs, setSubs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <div style={{
      maxWidth: 900,
      margin: "2rem auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "0 1rem"
    }}>
      <h1 style={{ textAlign:"center", marginBottom:"1rem" }}>Voz da Freguesia - Submissões</h1>

      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {["all", "Pending", "In Progress", "Resolved", "Rejected"].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 20,
              border: "2px solid",
              borderColor: filter === status ? "#2563eb" : "#ccc",
              backgroundColor: filter === status ? "#2563eb" : "white",
              color: filter === status ? "white" : "#333",
              fontWeight: "600",
              cursor: "pointer",
              textTransform: "capitalize",
              minWidth: 90,
              boxShadow: filter === status ? "0 0 8px #2563ebaa" : "none",
              transition: "all 0.3s ease"
            }}
          >
            {status === "all" ? "Todas" : statusLabels[status]}
          </button>
        ))}
      </div>

      <div style={{ textAlign: "right", marginBottom: "1rem" }}>
        <Link
          to="/new"
          style={{
            fontWeight: "600",
            backgroundColor: "#2563eb",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: 6,
            textDecoration: "none"
          }}
        >
          Nova submissão
        </Link>
        {!user && (
          <>
            <Link
              to="/login"
              style={{
                marginLeft: "1rem",
                fontWeight: "600",
                color: "#2563eb",
                padding: "0.5rem 1rem",
                borderRadius: 6,
                textDecoration: "none",
                border: "2px solid #2563eb"
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                marginLeft: "1rem",
                fontWeight: "600",
                color: "#10b981",
                padding: "0.5rem 1rem",
                borderRadius: 6,
                textDecoration: "none",
                border: "2px solid #10b981"
              }}
            >
              Registar
            </Link>
          </>
        )}
      </div>

      {loading && <p style={{textAlign: "center"}}>A carregar submissões...</p>}
      {error && <p style={{color: "red", textAlign: "center"}}>{error}</p>}

      {!loading && filtered.length === 0 && (
        <p style={{textAlign: "center", fontStyle: "italic"}}>
          Nenhuma submissão encontrada para o filtro selecionado.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {filtered.map(sub => (
          <Link
            to={`/submission/${sub._id}`}
            key={sub._id}
            style={{
              padding: "1rem",
              border: "1.5px solid #ddd",
              borderRadius: 8,
              textDecoration: "none",
              color: "#111",
              backgroundColor: "#fafafa",
              boxShadow: "1px 1px 6px #ccc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "box-shadow 0.3s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "3px 3px 12px #bbb"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "1px 1px 6px #ccc"}
          >
            <div>
              <h3 style={{ margin: 0 }}>{sub.title}</h3>
              <p style={{ margin: "0.25rem 0", fontWeight: "600", color: "#555" }}>
                Criado a {new Date(sub.createdAt).toLocaleString()}
              </p>
            </div>
            <div
              style={{
                padding: "0.35rem 1rem",
                borderRadius: 20,
                color: "white",
                backgroundColor: statusColors[sub.status] || "#999",
                fontWeight: "700",
                textTransform: "uppercase",
                fontSize: "0.85rem",
                minWidth: 110,
                textAlign: "center"
              }}
            >
              {statusLabels[sub.status]}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
