/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Página de Estatísticas: calcula tudo no cliente a partir da listagem
 * pública de submissões (sem endpoints de agregação dedicados) - total,
 * distribuição por estado, tempo médio de resolução, máximo de problemas
 * em aberto em simultâneo (sweep-line), incidências antigas e um gráfico
 * de colunas de submissões por mês.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

// Tradução e cor de cada estado, reutilizadas em vários pontos desta página
const statusLabels = {
  Pending: "Pendente",
  "In Progress": "Em progresso",
  Resolved: "Resolvida",
  Rejected: "Rejeitada"
};

const statusColors = {
  Pending: "#f59e0b",
  "In Progress": "#3b82f6",
  Resolved: "#10b981",
  Rejected: "#ef4444"
};

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Agrupa as submissões por mês de criação, para o gráfico "Submissões por mês".
// Gera sempre `nMeses` meses consecutivos terminados no mês atual, mesmo que
// alguns fiquem a zero, para o eixo do gráfico não "saltar" meses sem dados.
function calcularPorMes(subs, nMeses = 6) {
  const agora = new Date();
  const meses = [];
  for (let i = nMeses - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    meses.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MESES_PT[d.getMonth()], count: 0 });
  }
  const indexByKey = Object.fromEntries(meses.map((m, i) => [m.key, i]));
  subs.forEach(s => {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in indexByKey) meses[indexByKey[key]].count++;
  });
  return meses;
}

// Diferença entre duas datas, em dias (pode ter casas decimais)
function diasEntre(a, b) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

// Converte um número de dias num texto legível (ex: "2 meses", "1 ano e 3 meses")
function formatarIdade(dias) {
  const d = Math.floor(dias);
  if (d >= 365) {
    const anos = Math.floor(d / 365);
    const meses = Math.floor((d % 365) / 30);
    const anosTxt = `${anos} ano${anos > 1 ? "s" : ""}`;
    return meses > 0 ? `${anosTxt} e ${meses} ${meses > 1 ? "meses" : "mês"}` : anosTxt;
  }
  if (d >= 30) {
    const meses = Math.floor(d / 30);
    return `${meses} ${meses > 1 ? "meses" : "mês"}`;
  }
  return `${d} dia${d !== 1 ? "s" : ""}`;
}

// Calcula todas as métricas da página a partir da lista de submissões
function calcularEstatisticas(subs) {
  const total = subs.length;
  const porEstado = { Pending: 0, "In Progress": 0, Resolved: 0, Rejected: 0 };
  subs.forEach(s => { porEstado[s.status] = (porEstado[s.status] || 0) + 1; });

  const emAberto = porEstado.Pending + porEstado["In Progress"];

  // Tempo médio de resolução: do createdAt até à última mudança para "Resolved"
  const temposResolucao = [];
  subs.forEach(s => {
    if (s.status !== "Resolved") return;
    const eventos = (s.auditTrail || []).filter(ev => ev.action === "Status to Resolved");
    if (eventos.length === 0) return;
    const ultimo = eventos[eventos.length - 1];
    temposResolucao.push(diasEntre(new Date(s.createdAt), new Date(ultimo.timestamp)));
  });
  const tempoMedioResolucao = temposResolucao.length > 0
    ? temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length
    : null;

  // Máximo de submissões em aberto em simultâneo: percorre todos os eventos
  // de abertura (+1, na criação) e fecho (-1, na 1ª resolução ou rejeição)
  // ordenados no tempo, e segue a contagem corrente para encontrar o pico.
  const eventos = [];
  subs.forEach(s => {
    eventos.push({ time: new Date(s.createdAt), delta: 1 });
    const fechos = (s.auditTrail || [])
      .filter(ev => ev.action === "Status to Resolved" || ev.action === "Status to Rejected")
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (fechos.length > 0) {
      eventos.push({ time: new Date(fechos[0].timestamp), delta: -1 });
    }
  });
  eventos.sort((a, b) => a.time - b.time);
  let atual = 0;
  let maximoSimultaneo = 0;
  eventos.forEach(ev => {
    atual += ev.delta;
    if (atual > maximoSimultaneo) maximoSimultaneo = atual;
  });

  // Incidências abertas há muito tempo (ainda Pendentes ou Em progresso)
  const agora = new Date();
  const abertasOrdenadas = subs
    .filter(s => s.status === "Pending" || s.status === "In Progress")
    .map(s => ({ ...s, diasAberto: diasEntre(new Date(s.createdAt), agora) }))
    .sort((a, b) => b.diasAberto - a.diasAberto);
  const abertasMaisDeUmAno = abertasOrdenadas.filter(s => s.diasAberto >= 365).length;

  return { total, porEstado, emAberto, tempoMedioResolucao, maximoSimultaneo, abertasOrdenadas, abertasMaisDeUmAno };
}

// Gráfico de colunas simples (sem bibliotecas externas): a altura de cada
// coluna é proporcional ao valor máximo do conjunto, e só a coluna mais alta
// mostra o número por cima (evita poluir o gráfico com um valor em cada barra)
function MonthlyChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const alturaMax = 140;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: alturaMax + 46, paddingTop: 20 }}>
      {data.map(d => {
        const isMax = d.count > 0 && d.count === max;
        const altura = d.count === 0 ? 0 : Math.max((d.count / max) * alturaMax, 4);
        return (
          <div key={d.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text)", height: "1.1em", marginBottom: 4 }}>
              {isMax ? d.count : " "}
            </span>
            <div
              title={`${d.label}: ${d.count} submissões`}
              style={{
                width: 24,
                height: altura,
                backgroundColor: "var(--color-primary)",
                borderRadius: "4px 4px 0 0"
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 6 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Cartão simples de um número em destaque, usado para cada métrica principal
function StatTile({ label, value, sub }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text)", marginTop: 6 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Stats() {
  const [subs, setSubs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/submissions/all`, { withCredentials: true })
      .then(res => setSubs(res.data))
      .catch(() => setError("Erro ao carregar estatísticas"));
  }, []);

  if (error) return <div className="page error-text">{error}</div>;
  if (!subs) return <div className="page"><p>A carregar estatísticas...</p></div>;

  const stats = calcularEstatisticas(subs);
  const porMes = calcularPorMes(subs);

  return (
    <div className="page">
      <h1 style={{ marginBottom: "1.5rem" }}>Estatísticas</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <StatTile label="Total de submissões" value={stats.total} />
        <StatTile label="Em aberto agora" value={stats.emAberto} sub="Pendentes + em progresso" />
        <StatTile
          label="Tempo médio de resolução"
          value={stats.tempoMedioResolucao !== null ? `${stats.tempoMedioResolucao.toFixed(1)} dias` : "—"}
          sub={stats.tempoMedioResolucao === null ? "Sem submissões resolvidas" : undefined}
        />
        <StatTile label="Máximo em simultâneo" value={stats.maximoSimultaneo} sub="Problemas abertos ao mesmo tempo" />
        <StatTile label="Abertas há mais de 1 ano" value={stats.abertasMaisDeUmAno} sub="Ainda pendentes ou em progresso" />
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem", marginBottom: 4 }}>Submissões por mês</h2>
        <p style={{ marginTop: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Últimos 6 meses</p>
        <MonthlyChart data={porMes} />
      </div>

      {stats.abertasOrdenadas.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem", marginBottom: 4 }}>Incidências em aberto há mais tempo</h2>
          <p style={{ marginTop: 0, fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: 16 }}>
            Ainda pendentes ou em progresso, das mais antigas para as mais recentes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.abertasOrdenadas.slice(0, 5).map(s => (
              <Link
                key={s._id}
                to={`/submission/${s._id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "0.6rem 0.9rem",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  textDecoration: "none",
                  color: "var(--color-text)"
                }}
              >
                <span style={{ fontWeight: 600 }}>{s.title}</span>
                <span
                  className="badge"
                  style={{ backgroundColor: s.diasAberto >= 365 ? "#ef4444" : "#64748b" }}
                >
                  Aberta há {formatarIdade(s.diasAberto)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem", marginBottom: 16 }}>Distribuição por estado</h2>

        {stats.total === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>Ainda não existem submissões.</p>
        ) : (
          <>
            <div style={{ display: "flex", width: "100%", height: 20, borderRadius: 6, overflow: "hidden" }}>
              {Object.keys(statusLabels).map((key, i) => {
                const count = stats.porEstado[key] || 0;
                if (count === 0) return null;
                const pct = (count / stats.total) * 100;
                return (
                  <div
                    key={key}
                    title={`${statusLabels[key]}: ${count} (${pct.toFixed(1)}%)`}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: statusColors[key],
                      marginRight: i < Object.keys(statusLabels).length - 1 ? 2 : 0
                    }}
                  />
                );
              })}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: 16 }}>
              {Object.keys(statusLabels).map(key => {
                const count = stats.porEstado[key] || 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: statusColors[key], display: "inline-block" }} />
                    <span style={{ color: "var(--color-text)" }}>{statusLabels[key]}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>— {count} ({pct.toFixed(1)}%)</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
