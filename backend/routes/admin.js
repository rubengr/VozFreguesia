/**
 * Voz da Freguesia - Backend
 * ---------------------------------------------------------------------------
 * Rotas de administração de utilizadores. Todas exigem o papel "admin" -
 * é o único papel com acesso à gestão de contas (criar, mudar papel, repor
 * password, listar). Reforça aqui a regra de "um único presidente de
 * cada vez" sempre que um papel é atribuído.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { auth, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Cria diretamente um utilizador de assembleia ou presidente (apenas admins).
// Não permite criar outro "admin" por aqui nem um "resident" (esses
// registam-se sozinhos em /api/auth/register).
router.post('/create-user', auth, requireRole("admin"), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nome, email e password são obrigatórios" });
  }
  if (!["assembly", "president"].includes(role)) {
    return res.status(400).json({ error: "Role inválido" });
  }
  // Regra de negócio: só pode haver um presidente ativo de cada vez.
  if (role === "president") {
    const presidenteExistente = await User.findOne({ role: "president" });
    if (presidenteExistente) {
      return res.status(400).json({ error: "Já existe um presidente. Demova o atual antes de criar um novo." });
    }
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash, role });
    await user.save();
    res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Este email já está registado" });
    }
    console.error("Erro ao criar utilizador:", error);
    res.status(500).json({ error: "Erro ao criar utilizador" });
  }
});

// Muda o papel de um utilizador já existente (ex: promover um residente a
// membro da assembleia). Sujeito à mesma regra de presidente único.
router.post('/set-role', auth, requireRole("admin"), async (req, res) => {
  const { userId, role } = req.body;
  if (!["resident", "assembly", "admin", "president"].includes(role)) {
    return res.status(400).json({ error: "Role inválido" });
  }
  if (role === "president") {
    // $ne garante que não se bloqueia a si próprio ao reconfirmar o mesmo papel
    const presidenteExistente = await User.findOne({ role: "president", _id: { $ne: userId } });
    if (presidenteExistente) {
      return res.status(400).json({ error: "Já existe um presidente. Demova o atual antes de promover outro." });
    }
  }
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  user.role = role;
  await user.save();
  res.json({ success: true, user });
});

// Repõe a password de qualquer utilizador (ex: quando alguém se esquece e
// não tem acesso a email, o admin pode repor manualmente)
router.post('/change-password', auth, requireRole("admin"), async (req, res) => {
  const { userId, password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres" });
  }
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  user.password = await bcrypt.hash(password, 10);
  await user.save();
  res.json({ success: true });
});

// Lista todos os utilizadores, para a tabela do painel de administração.
// Só devolve campos públicos (nunca a password).
router.get('/users', auth, requireRole("admin"), async (req, res) => {
    try {
      const users = await User.find({}, 'name email role');
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Erro ao obter usuários" });
    }
  });

export default router;
