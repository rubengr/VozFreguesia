/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Componente raiz da aplicação: define a navbar (sempre visível) e o mapa
 * de rotas de todas as páginas.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { BrowserRouter, Route, Routes } from "react-router-dom";
import SubmissionsList from "./pages/SubmissionsList";
import SubmissionDetails from "./pages/SubmissionDetails";
import Login from "./pages/Login";
import NewSubmission from "./pages/NewSubmission";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Stats from "./pages/Stats";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NavBar from "./components/NavBar";

export default function App() {
  return (
    <BrowserRouter>
      {/* Barra de navegação persistente em todas as páginas */}
      <NavBar />
      <Routes>
        <Route path="/" element={<SubmissionsList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/new" element={<NewSubmission />} />
        <Route path="/submission/:id" element={<SubmissionDetails />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}
