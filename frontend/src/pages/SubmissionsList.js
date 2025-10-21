import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import axios from "axios";

export default function SubmissionsList() {
  const { user } = useContext(AuthContext);
  const [subs, setSubs] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    axios.get("http://localhost:4000/api/submissions/all", { withCredentials: true }).then(res => setSubs(res.data));
  }, []);

  const filtered = filter === "all" ? subs : subs.filter(s => s.status === filter);

  return (
    <div>
      <h2>Submissões</h2>
      <button onClick={() => setFilter("all")}>Todas</button>
      <button onClick={() => setFilter("Pending")}>Pendentes</button>
      <button onClick={() => setFilter("In Progress")}>Em andamento</button>
      <button onClick={() => setFilter("Resolved")}>Resolvidas</button>
      <button onClick={() => setFilter("Rejected")}>Rejeitadas</button>
      <Link to="/new">Nova submissão</Link>
      {!user && <Link to="/login">Login</Link>}
      {filtered.map(sub => (
        <div key={sub._id}>
          <Link to={`/submission/${sub._id}`}>
            <h4>{sub.title}</h4>
            <p>Status: {sub.status}</p>
            <small>{new Date(sub.createdAt).toLocaleString()}</small>
          </Link>
        </div>
      ))}
    </div>
  );
}
