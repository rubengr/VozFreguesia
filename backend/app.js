import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import submissionRoutes from './routes/submission.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);

mongoose.connect(process.env.MONGO_URI).then(() =>
  app.listen(process.env.PORT, () => console.log("Backend running..."))
).catch(console.error);
