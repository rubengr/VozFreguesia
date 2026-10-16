/**
 * Voz da Freguesia - Backend
 * ---------------------------------------------------------------------------
 * Ponto de entrada da aplicação Express. Configura middlewares globais, liga
 * as rotas da API, assegura que existe sempre uma conta de administrador e
 * arranca o servidor depois de confirmar a ligação ao MongoDB.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import submissionRoutes from './routes/submission.js';
import adminRoutes from './routes/admin.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

// Carrega as variáveis de ambiente definidas em backend/.env (PORT, MONGO_URI, JWT_SECRET, ...)
dotenv.config();

/**
 * Garante que existe sempre pelo menos uma conta de administrador assim que
 * o backend arranca, para que nunca se fique "trancado de fora" do painel de
 * gestão de utilizadores numa instalação nova.
 */
async function criarAdminPadrao() {
  const adminEmail = "admin@admin.com";
  const existeAdmin = await User.findOne({ email: adminEmail });
  if (!existeAdmin) {
    const hash = await bcrypt.hash("admin123", 10); // senha segura
    const admin = new User({
      name: "Administrador Padrão",
      email: adminEmail,
      password: hash,
      role: "admin"
    });
    await admin.save();
    console.log("Conta administrativa padrão criada: ", adminEmail);
  }
}

const app = express();

// Interpreta o corpo dos pedidos como JSON (ex: formulários de login/registo)
app.use(express.json());

// Só o frontend configurado em FRONTEND_URL (localhost:3000 em desenvolvimento)
// pode chamar esta API, e os cookies de sessão (JWT) são permitidos nesses
// pedidos (credentials: true).
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));

// Permite ler o cookie "token" (sessão) nos pedidos recebidos.
app.use(cookieParser());

// Serve os ficheiros anexados às submissões (fotos, documentos) diretamente
// a partir da pasta uploads/, ex: http://localhost:4000/uploads/ficheiro.png
app.use('/uploads', express.static('uploads'));

// Rotas da API, agrupadas por domínio funcional
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use("/api/admin", adminRoutes);

// Só arranca o servidor HTTP depois de confirmar a ligação à base de dados,
// para evitar aceitar pedidos antes de estarmos prontos para os servir.
mongoose.connect(process.env.MONGO_URI).then(async() => {
  await criarAdminPadrao();
  app.listen(process.env.PORT, () => console.log("Backend running..."))
}).catch(console.error);
