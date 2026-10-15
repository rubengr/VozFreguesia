/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Ponto de entrada do React: monta a aplicação dentro do AuthProvider, para
 * que a sessão do utilizador esteja disponível em qualquer página.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // O seu componente principal
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
