import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hash, role: role || "resident" });
  await user.save();
  res.json({ success: true });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).send('Invalid');
  const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.json({ success: true, role: user.role, name: user.name });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

export default router;
