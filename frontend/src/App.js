import { BrowserRouter, Route, Routes } from "react-router-dom";
import SubmissionsList from "./pages/SubmissionsList";
import SubmissionDetails from "./pages/SubmissionDetails";
import Login from "./pages/Login";
import NewSubmission from "./pages/NewSubmission";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SubmissionsList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/new" element={<NewSubmission />} />
        <Route path="/submission/:id" element={<SubmissionDetails />} />
      </Routes>
    </BrowserRouter>
  );
}
