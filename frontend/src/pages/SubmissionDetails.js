import { useParams } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

export default function SubmissionDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [sub, setSub] = useState(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    axios.get(`http://localhost:4000/api/submissions/${id}`).then(res => setSub(res.data));
  }, [id]);

  const refresh = () => axios.get(`http://localhost:4000/api/submissions/${id}`).then(res => setSub(res.data));

  const sendReply = async () => {
    await axios.post(`http://localhost:4000/api/submissions/${id}/reply`, { text: reply }, { withCredentials: true });
    setReply('');
    refresh();
  };

  const changeStatus = async () => {
    await axios.post(`http://localhost:4000/api/submissions/${id}/status`, { status }, { withCredentials: true });
    refresh();
  };

  const voteReject = async () => {
    await axios.post(`http://localhost:4000/api/submissions/${id}/admin-vote-reject`, {}, { withCredentials: true });
    refresh();
  };

  if (!sub) return <div>Carregando...</div>;

  return (
    <div>
      <h3>{sub.title}</h3>
      <p>{sub.description}</p>
      {sub.attachments.map(file =>
        <div key={file}>
          <a href={`http://localhost:4000/uploads/${file}`} target="_blank" rel="noreferrer">Ver anexo</a>
        </div>
      )}
      <p>Status: {sub.status}</p>
      <h4>Histórico:</h4>
      <ul>
        {sub.auditTrail.map((ev, i) =>
          <li key={i}>{ev.action} por {ev.user} ({new Date(ev.timestamp).toLocaleString()})</li>
        )}
      </ul>
      <h4>Respostas:</h4>
      {sub.replies?.map((rep, i) =>
        <div key={i}>
          <strong>{rep.fromRole === "president" ? "Presidente" : "Residente"}: </strong>
          {rep.text} <small>({new Date(rep.timestamp).toLocaleString()})</small>
        </div>
      )}
      {user?.role === "president" && (
        <div>
          <textarea value={reply} onChange={e => setReply(e.target.value)} />
          <button onClick={sendReply}>Responder como presidente</button>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Alterar status</option>
            <option value="Pending">Pendente</option>
            <option value="In Progress">Em andamento</option>
            <option value="Resolved">Resolvida</option>
            <option value="Rejected">Rejeitada</option>
          </select>
          <button onClick={changeStatus}>Atualizar status</button>
        </div>
      )}
      {user?.role === "resident" && (
        <div>
          <textarea value={reply} onChange={e => setReply(e.target.value)} />
          <button onClick={sendReply}>Responder ao presidente</button>
        </div>
      )}
      {user?.role === "admin" && (
        <div>
          <button onClick={voteReject}>Votar rejeição</button>
        </div>
      )}
    </div>
  );
}
