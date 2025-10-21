import { BrowserRouter, Route, Routes } from "react-router-dom";
import SubmissionsList from "./pages/SubmissionsList";
import SubmissionDetails from "./pages/SubmissionDetails";
import Login from "./pages/Login";
import NewSubmission from "./pages/NewSubmission";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SubmissionsList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/new" element={<NewSubmission />} />
        <Route path="/submission/:id" element={<SubmissionDetails />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
