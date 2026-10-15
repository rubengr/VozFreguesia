/**
 * Voz da Freguesia - Backend
 * ---------------------------------------------------------------------------
 * Modelo de utilizador. Define os 4 papéis (roles) existentes na aplicação
 * e os campos usados no fluxo de recuperação de password por email.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  // "sparse" permite que vários documentos não tenham email definido, mas
  // garante que, quando existe, é único (não há dois utilizadores com o
  // mesmo email registado).
  email: { type: String, unique: true, sparse: true },
  password: String, // guardada sempre como hash bcrypt, nunca em texto simples
  // resident: fregues, sem acesso a qualquer painel - só submete e segue pedidos;
  // assembly: membro da assembleia - confirma (por unanimidade) propostas de
  //   rejeição feitas pelo presidente, sem acesso à gestão de utilizadores;
  // admin: administrador do sistema - cria/gere contas de assembleia e presidente;
  // president: presidente da junta - responde, altera estados e propõe rejeições.
  role: { type: String, enum: ["resident", "assembly", "admin", "president"], default: "resident" },
  // Usados apenas durante um pedido de recuperação de password ("esqueci-me
  // da password"): guardam um hash do token enviado por email e a sua
  // validade, para que o link expire e não possa ser reutilizado.
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

export default mongoose.model('User', userSchema);
