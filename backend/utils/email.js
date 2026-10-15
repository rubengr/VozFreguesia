/**
 * Voz da Freguesia - Backend
 * ---------------------------------------------------------------------------
 * Envio de emails transacionais através do Resend (serviço gratuito). Se
 * RESEND_API_KEY não estiver definida no .env, as notificações são apenas
 * registadas na consola (útil em desenvolvimento) em vez de falhar o pedido.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Notifica o autor de uma submissão quando o presidente lhe responde
export async function enviarNotificacaoResposta({ to, submissionTitle, submissionId, replyText }) {
  if (!to || !resend) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Nova resposta à sua submissão: ${submissionTitle}`,
      html: `
        <p>Olá,</p>
        <p>Recebeu uma nova resposta à sua submissão "<strong>${submissionTitle}</strong>":</p>
        <blockquote style="border-left: 3px solid #2563eb; margin: 0; padding-left: 12px; color: #333;">${replyText}</blockquote>
        <p><a href="${FRONTEND_URL}/submission/${submissionId}">Ver submissão completa</a></p>
      `
    });
  } catch (error) {
    console.error("Erro ao enviar email de notificação:", error);
  }
}

// Envia o link de recuperação de password (ou regista-o na consola, se o
// Resend não estiver configurado)
export async function enviarEmailRecuperacaoPassword({ to, resetToken }) {
  const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;

  if (!resend) {
    // Sem Resend configurado: regista o link na consola para facilitar o desenvolvimento local.
    console.log(`[dev] Link de recuperação de password para ${to}: ${resetUrl}`);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Recuperação de password - Voz da Freguesia",
      html: `
        <p>Olá,</p>
        <p>Recebemos um pedido de recuperação de password para esta conta.</p>
        <p><a href="${resetUrl}">Clique aqui para definir uma nova password</a></p>
        <p>Este link é válido durante 1 hora. Se não pediu esta recuperação, pode ignorar este email.</p>
      `
    });
  } catch (error) {
    console.error("Erro ao enviar email de recuperação de password:", error);
  }
}
