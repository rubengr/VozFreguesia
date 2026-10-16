/**
 * Voz da Freguesia - Backend
 * ---------------------------------------------------------------------------
 * Rotas de autenticação e gestão da própria conta: sessão atual, perfil,
 * mudança de password, registo público, login/logout, e recuperação de
 * password por email (esqueci-me da password).
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { enviarEmailRecuperacaoPassword } from '../utils/email.js';

const router = express.Router();

// Permite ao frontend saber quem está logado (ex: após refresh da página).
// Resposta leve, baseada apenas no que já foi validado pelo middleware `auth`.
router.get('/me', auth, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name, role: req.user.role, email: req.user.email });
});

// Perfil completo do utilizador logado, para a página "O meu perfil"
router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.user.id, 'name email role');
  if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });
  res.json(user);
});

// O próprio utilizador altera a sua password (tem de confirmar a atual)
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "A nova password deve ter pelo menos 6 caracteres" });
  }
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });

  const correta = await bcrypt.compare(currentPassword || '', user.password);
  if (!correta) {
    return res.status(401).json({ error: "Password atual incorreta" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ success: true });
});

// Registo público - qualquer pessoa se pode registar como fregues (resident).
// Promoções a assembleia/presidente/admin só podem ser feitas depois por um
// administrador (ver routes/admin.js) - nunca a partir deste endpoint.
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash, role: "resident" });
    await user.save();
    res.json({ success: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Este email já está registado" });
    }
    console.error("Erro ao registar utilizador:", error);
    res.status(500).json({ error: "Erro ao registar utilizador" });
  }
});

// Login - verifica a password e emite um cookie httpOnly com um JWT que
// identifica o utilizador (o papel é sempre reconfirmado na BD a cada
// pedido, ver middleware/auth.js, por isso não precisa de expirar cedo).
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Email ou password inválidos" });
  const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET);
  // Em produção (HTTPS) o cookie só deve viajar em pedidos seguros
  res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  res.json({ success: true, id: user._id, role: user.role, name: user.name, email: user.email });
});

// Logout - simplesmente apaga o cookie de sessão
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Pedido de recuperação de password ("esqueci-me da password"). Responde
// sempre com a mesma mensagem genérica, exista ou não o email, para não
// revelar a terceiros que emails estão registados na aplicação.
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const genericResponse = { success: true, message: "Se o email existir, foi enviado um link de recuperação." };

  if (!email) return res.json(genericResponse);

  const user = await User.findOne({ email });
  if (!user) return res.json(genericResponse); // não revela se o email existe

  // Gera um token aleatório; só o seu hash (SHA-256) fica guardado na BD, à
  // semelhança de uma password - mesmo que a BD seja comprometida, não dá
  // para reconstruir o link de recuperação original a partir do que lá está.
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // válido 1 hora
  await user.save();

  await enviarEmailRecuperacaoPassword({ to: user.email, resetToken: rawToken });

  res.json(genericResponse);
});

// Define uma nova password a partir do token recebido por email. O token só
// é aceite se corresponder (via hash) a um pedido ainda dentro da validade.
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Token e nova password (mín. 6 caracteres) são obrigatórios" });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json({ error: "Link de recuperação inválido ou expirado" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  // Invalida o token depois de usado, para que o mesmo link não sirva duas vezes
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ success: true });
});

export default router;
