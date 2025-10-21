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

dotenv.config();

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
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use("/api/admin", adminRoutes);

mongoose.connect(process.env.MONGO_URI).then(async() => {
  await criarAdminPadrao();
  app.listen(process.env.PORT, () => console.log("Backend running..."))
}).catch(console.error);
