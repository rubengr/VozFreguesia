import express from 'express';
import multer from 'multer';
import Submission from '../models/Submission.js';
import { auth, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';

const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();

// Nova submissão (anónima ou autenticada)
router.post('/new', upload.array('attachments', 3), async (req, res) => {
  const { title, description, anonymous, authorName, authorEmail } = req.body;
  const files = req.files ? req.files.map(f => f.filename) : [];
  const status = "Pending";
  const auditTrail = [{
    action: 'Created',
    user: anonymous === "true" ? "anonymous" : (authorName || "autenticado"),
    timestamp: new Date(),
  }];
  const sub = new Submission({
    title,
    description,
    attachments: files,
    authorName: anonymous === "true" ? null : authorName,
    authorEmail: anonymous === "true" ? null : authorEmail,
    anonymous: anonymous === "true",
    status,
    auditTrail
  });
  await sub.save();
  res.json({ success: true });
});

// Listagem pública (por ordem reversa cronológica)
router.get('/all', async (req, res) => {
  const subs = await Submission.find().sort({ createdAt: -1 });
  res.json(subs);
});

// Obter submissão por ID
router.get('/:id', async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).send('Not found');
  res.json(sub);
});

// Responder (apenas presidente ou residente identificado)
router.post('/:id/reply', auth, async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  const userRole = req.user.role === "president" ? "president" : "resident";
  sub.replies.push({
    fromRole: userRole,
    text: req.body.text,
    timestamp: new Date()
  });
  sub.auditTrail.push({
    action: "Reply",
    user: req.user.name,
    timestamp: new Date()
  });
  await sub.save();
  res.json({ success: true });
});

// Presidente altera status
router.post('/:id/status', auth, requireRole("president"), async (req, res) => {
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

// Assembleia vota rejeição
router.post('/:id/admin-vote-reject', auth, requireRole("admin"), async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).send('Not found');
  if (sub.status !== "Pending") return res.status(400).send('Só para pendentes');

  if (!sub.votesToReject.map(v=>String(v.adminId)).includes(req.user.id)) {
    sub.votesToReject.push({ adminId: req.user.id });
    sub.auditTrail.push({
      action: "Voted rejection",
      user: req.user.name,
      timestamp: new Date()
    });
  }
  const adminCount = await User.countDocuments({ role: "admin" });
  if (sub.votesToReject.length >= adminCount && adminCount > 0) {
    sub.status = "Rejected";
    sub.auditTrail.push({
      action: "Submission rejected (all admins)",
      user: "Admins",
      timestamp: new Date()
    });
  }
  await sub.save();
  res.json({ success: true, status: sub.status });
});

export default router;
