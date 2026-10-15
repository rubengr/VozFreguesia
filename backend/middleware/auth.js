/**
 * Voz da Freguesia - Backend
 * ---------------------------------------------------------------------------
 * Middlewares de autenticação e autorização baseados em JWT guardado num
 * cookie httpOnly. Qualquer rota protegida importa `auth` (obrigatório) ou
 * `optionalAuth` (identifica se possível, mas não bloqueia visitantes), e
 * `requireRole` para restringir a um papel específico (ex: "president").
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Valida o token e devolve os dados ATUAIS do utilizador.
 *
 * Importante: o token só prova a identidade (contém o id do utilizador); o
 * papel (role) e o nome são sempre lidos de fresco na base de dados, em vez
 * de confiar no que ficou gravado no token no momento do login. Isto garante
 * que uma mudança de role (ex: promoção ou despromoção feita pelo admin) tem
 * efeito imediato em todos os pedidos seguintes, sem a pessoa ter de voltar
 * a fazer login para "renovar" a sua sessão.
 */
async function carregarUtilizadorAtual(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.id, 'name role email');
  if (!user) return null;
  return { id: user._id.toString(), name: user.name, role: user.role, email: user.email };
}

/**
 * Middleware obrigatório: exige uma sessão válida. Preenche `req.user` com
 * { id, name, role, email } ou responde 401 se não houver sessão.
 */
export async function auth(req, res, next) {
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  try {
    const user = await carregarUtilizadorAtual(token);
    if (!user) return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
  }
}

/**
 * Middleware opcional: tenta identificar quem está a fazer o pedido, mas
 * nunca bloqueia. Usado em rotas públicas (ex: listagem de submissões) que
 * precisam de saber se quem pede tem privilégios extra, sem exigir login.
 */
export async function optionalAuth(req, res, next) {
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();
  try {
    req.user = await carregarUtilizadorAtual(token);
  } catch {
    // token inválido/expirado: segue como anónimo
  }
  next();
}

/**
 * Fábrica de middleware: só deixa passar se `req.user.role` corresponder
 * exatamente ao papel pedido. Deve ser usado sempre depois de `auth`.
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) next();
    else res.status(403).json({ error: 'Não tem permissão para esta ação.' });
  }
}
