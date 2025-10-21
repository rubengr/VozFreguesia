import express from 'express';
import { auth, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/set-role', auth, requireRole("admin"), async (req, res) => {
  const { userId, role } = req.body;
  if (!["resident", "admin", "president"].includes(role)) {
    return res.status(400).json({ error: "Role inválido" });
  }
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  
  user.role = role;
  await user.save();
  res.json({ success: true, user });
});

// Listar todos os usuários (apenas admins)
router.get('/users', auth, requireRole("admin"), async (req, res) => {
    try {
      const users = await User.find({}, 'name email role'); // só campos públicos
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Erro ao obter usuários" });
    }
  });
  
export default router;
