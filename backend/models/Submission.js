/**
 * Voz da Freguesia - Backend
 * ---------------------------------------------------------------------------
 * Modelo de submissão (o "pedido" que um fregues reporta à junta): queixa,
 * sugestão ou reclamação, com respostas, histórico de auditoria e o fluxo
 * de rejeição em duas etapas (proposta do presidente + confirmação da
 * assembleia).
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import mongoose from 'mongoose';

// Uma resposta dentro da conversa de uma submissão (do residente ou do presidente)
const replySchema = new mongoose.Schema({
  fromRole: String, // 'resident' ou 'president'
  authorName: String, // nome de quem respondeu, para mostrar na interface
  text: String,
  timestamp: { type: Date, default: Date.now }
});

// Uma entrada do histórico/auditoria (quem fez o quê e quando), mostrada na
// secção "Histórico" da página de detalhe da submissão.
const auditSchema = new mongoose.Schema({
  action: String,
  user: String,
  timestamp: Date,
});

// Um voto de confirmação de rejeição, dado por um membro da assembleia.
// Guarda apenas o id de quem votou; a contagem de votos válidos é sempre
// recalculada em tempo real contra quem É atualmente membro da assembleia
// (ver routes/submission.js), para que um voto antigo de alguém entretanto
// despromovido não continue a contar.
const voteSchema = new mongoose.Schema({
  adminId: mongoose.Schema.Types.ObjectId
});

const submissionSchema = new mongoose.Schema({
  title: String,
  description: String,
  attachments: [String], // nomes dos ficheiros guardados em backend/uploads/
  // Preenchidos apenas quando a submissão não é anónima
  authorName: String,
  authorEmail: String, // usado para enviar notificações de resposta por email
  anonymous: Boolean,
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema],
  votesToReject: [voteSchema],
  // Fluxo de rejeição: o presidente propõe (preenche estes dois campos, sem
  // alterar o status), e só quando TODOS os membros atuais da assembleia
  // confirmarem (votesToReject) é que o status passa a "Rejected" e a
  // submissão fica oculta do público.
  rejectionProposedBy: String,
  rejectionProposedAt: Date,
  auditTrail: [auditSchema]
});

export default mongoose.model('Submission', submissionSchema);
