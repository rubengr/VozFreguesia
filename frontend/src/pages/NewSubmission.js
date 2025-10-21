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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Título <input value={title} onChange={e => setTitle(e.target.value)} required /></label>
      <label>Descrição <textarea value={description} onChange={e => setDescription(e.target.value)} required /></label>
      <input type="file" multiple accept=".jpg,.png,.pdf,.docx" onChange={e => setFiles([...e.target.files])} />
      {user && (
        <>
          <label>
            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} /> Submissão anónima
          </label>
          {!anonymous && (
            <>
              <label>Nome <input value={authorName} onChange={e => setAuthorName(e.target.value)} /></label>
              <label>Email <input value={authorEmail} onChange={e => setAuthorEmail(e.target.value)} /></label>
            </>
          )}
        </>
      )}
      <button type="submit">Enviar</button>
    </form>
  );
}
