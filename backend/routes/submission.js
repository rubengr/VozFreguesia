/**
 * Voz da Freguesia - Backend
 * ---------------------------------------------------------------------------
 * Rotas do ciclo de vida de uma submissão: criação (com anexos), listagem e
 * consulta pública, respostas, mudança de estado pelo presidente, e o fluxo
 * de rejeição em duas etapas (o presidente propõe, a assembleia confirma por
 * unanimidade). Submissões rejeitadas ficam ocultas do público.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import express from 'express';
import multer from 'multer';
import Submission from '../models/Submission.js';
import { auth, requireRole, optionalAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import path from "path";
import { enviarNotificacaoResposta } from '../utils/email.js';

// Submissões rejeitadas pela assembleia (ex: faltas de respeito) saem de circulação
// pública; só quem gere a freguesia continua a vê-las.
const PRIVILEGED_ROLES = ["president", "admin", "assembly"];
const podeVerRejeitadas = (user) => !!user && PRIVILEGED_ROLES.includes(user.role);

// Configuração do multer para guardar os ficheiros anexados (fotos/documentos)
// em disco, em backend/uploads/, com um nome único para evitar colisões entre
// uploads com o mesmo nome de ficheiro original.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);  // preserva extensão
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });
const router = express.Router();

// Cria uma nova submissão (anónima ou identificada). Não exige login - tanto
// um residente autenticado como um visitante anónimo podem reportar um problema.
router.post("/new", upload.array("attachments",10), async (req, res) => {
  try {
    const { title, description, anonymous, authorName, authorEmail } = req.body;
    const files = req.files ? req.files.map(f => f.filename) : [];
    const status = "Pending";
    const auditTrail = [{
      action: "Created",
      user: anonymous === "true" ? "anónimo" : (authorName || "autenticado"),
      timestamp: new Date(),
    }];

    const sub = new Submission({
      title,
      description,
      attachments: files,
      // Se for anónima, nunca guardamos nome/email, mesmo que tenham sido enviados
      authorName: anonymous === "true" ? null : authorName,
      authorEmail: anonymous === "true" ? null : authorEmail,
      anonymous: anonymous === "true",
      status,
      auditTrail,
    });

    await sub.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar submissão:", error);
    res.status(500).json({ error: "Erro ao criar submissão" });
  }
});

// Listagem pública, da mais recente para a mais antiga. `optionalAuth`
// identifica o utilizador se houver sessão, para decidir se mostra também
// as submissões rejeitadas (só a presidente/admin/assembleia).
router.get('/all', optionalAuth, async (req, res) => {
  const filtro = podeVerRejeitadas(req.user) ? {} : { status: { $ne: "Rejected" } };
  const subs = await Submission.find(filtro).sort({ createdAt: -1 });
  res.json(subs);
});

// Obtém uma submissão pelo id. Devolve 404 (não só para "não existe", mas
// também) quando está rejeitada e quem pede não tem privilégio para a ver -
// de propósito, para não revelar sequer que aquele id corresponde a algo oculto.
router.get('/:id', optionalAuth, async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).send('Not found');
  if (sub.status === "Rejected" && !podeVerRejeitadas(req.user)) {
    return res.status(404).send('Not found');
  }
  res.json(sub);
});

// Adiciona uma resposta à conversa da submissão. Tanto o presidente como um
// residente autenticado podem responder; qualquer outro papel autenticado
// (admin/assembleia) é tratado aqui como "resident" para efeitos de resposta,
// já que não têm uma voz especial nesta conversa.
router.post('/:id/reply', auth, async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  const userRole = req.user.role === "president" ? "president" : "resident";
  sub.replies.push({
    fromRole: userRole,
    authorName: req.user.name,
    text: req.body.text,
    timestamp: new Date()
  });
  sub.auditTrail.push({
    action: "Reply",
    user: req.user.name,
    timestamp: new Date()
  });
  await sub.save();

  // Notifica o autor por email só quando é o presidente a responder (é a
  // resposta "oficial" que o residente está à espera de receber)
  if (userRole === "president" && sub.authorEmail) {
    enviarNotificacaoResposta({
      to: sub.authorEmail,
      submissionTitle: sub.title,
      submissionId: sub._id,
      replyText: req.body.text
    });
  }

  res.json({ success: true });
});

// O presidente altera o estado da submissão. A rejeição está deliberadamente
// fora desta lista - só pode acontecer através do fluxo propose/confirm
// abaixo, para que uma única pessoa nunca possa rejeitar sozinha.
router.post('/:id/status', auth, requireRole("president"), async (req, res) => {
  const estadosPermitidos = ["Pending", "In Progress", "Resolved"];
  if (!estadosPermitidos.includes(req.body.status)) {
    return res.status(400).json({ error: "Estado inválido. A rejeição só pode ser decidida por votação da assembleia." });
  }
  const sub = await Submission.findById(req.params.id);
  sub.status = req.body.status;
  sub.auditTrail.push({
    action: `Status to ${req.body.status}`,
    user: req.user.name,
    timestamp: new Date()
  });
  await sub.save();
  res.json({ success: true });
});

// O presidente propõe a rejeição de uma submissão pendente (ex: conteúdo
// impróprio). Isto NÃO muda o estado nem oculta a submissão - fica à vista
// de todos até a assembleia confirmar ou o presidente cancelar.
router.post('/:id/propose-rejection', auth, requireRole("president"), async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).send('Not found');
  if (sub.status !== "Pending") return res.status(400).json({ error: "Só é possível propor rejeição para submissões pendentes." });
  if (sub.rejectionProposedBy) return res.status(400).json({ error: "Já existe uma proposta de rejeição em curso." });

  sub.rejectionProposedBy = req.user.name;
  sub.rejectionProposedAt = new Date();
  sub.auditTrail.push({
    action: "Rejection proposed by president",
    user: req.user.name,
    timestamp: new Date()
  });
  await sub.save();
  res.json({ success: true });
});

// O presidente desiste da proposta de rejeição, antes de ser confirmada.
// Limpa também quaisquer votos já dados, para começar do zero se voltar a propor.
router.post('/:id/cancel-rejection-proposal', auth, requireRole("president"), async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).send('Not found');
  if (!sub.rejectionProposedBy) return res.status(400).json({ error: "Não há nenhuma proposta de rejeição em curso." });

  sub.rejectionProposedBy = undefined;
  sub.rejectionProposedAt = undefined;
  sub.votesToReject = [];
  sub.auditTrail.push({
    action: "Rejection proposal cancelled by president",
    user: req.user.name,
    timestamp: new Date()
  });
  await sub.save();
  res.json({ success: true });
});

// Um membro da assembleia confirma a proposta de rejeição do presidente.
// Só se torna definitiva (status "Rejected", oculta do público) quando
// TODOS os membros atuais da assembleia tiverem confirmado - por isso a
// contagem de votos válidos é sempre recalculada contra quem É assembleia
// neste preciso momento, e não contra quem era assembleia quando votou.
router.post('/:id/admin-vote-reject', auth, requireRole("assembly"), async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).send('Not found');
  if (sub.status !== "Pending") return res.status(400).send('Só para pendentes');
  if (!sub.rejectionProposedBy) {
    return res.status(400).json({ error: "Só pode confirmar rejeição depois do presidente a propor." });
  }

  // Regista o voto apenas se esta pessoa ainda não tiver votado (evita duplicados)
  if (!sub.votesToReject.map(v=>String(v.adminId)).includes(req.user.id)) {
    sub.votesToReject.push({ adminId: req.user.id });
    sub.auditTrail.push({
      action: "Confirmed rejection",
      user: req.user.name,
      timestamp: new Date()
    });
  }

  // Só contam votos de quem é atualmente membro da assembleia - um voto antigo
  // de alguém entretanto promovido/despromovido não deve pesar na contagem.
  const assemblyUsers = await User.find({ role: "assembly" }, '_id');
  const assemblyIds = new Set(assemblyUsers.map(u => String(u._id)));
  const validVotes = sub.votesToReject.filter(v => assemblyIds.has(String(v.adminId))).length;

  if (validVotes >= assemblyIds.size && assemblyIds.size > 0) {
    sub.status = "Rejected";
    sub.auditTrail.push({
      action: "Rejection confirmed by assembly",
      user: "Assembleia",
      timestamp: new Date()
    });
  }
  await sub.save();
  res.json({ success: true, status: sub.status });
});

export default router;
