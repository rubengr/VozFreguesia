/**
 * Voz da Freguesia - Backend
 * ---------------------------------------------------------------------------
 * Script de seed (`npm run seed`): povoa a base de dados de desenvolvimento
 * com utilizadores de demonstração (um por cada papel) e um conjunto de
 * submissões de exemplo que cobrem todos os casos de uso da aplicação -
 * estados diferentes, anexos (imagens geradas na hora), respostas em
 * vaivém, incidências antigas e o fluxo completo de proposta/confirmação
 * de rejeição.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import bcrypt from 'bcryptjs';
import Submission from './models/Submission.js';
import User from './models/User.js';

dotenv.config();

// ---------------------------------------------------------------------------
// Gerador mínimo de PNG (sem dependências externas), para termos "fotos" de
// exemplo reais nos anexos das submissões, em vez de nomes de ficheiro que
// apontam para nada.
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Gera uma imagem simples (gradiente vertical entre duas cores) para servir
// de "foto" de exemplo anexada a uma submissão.
function criarImagemExemplo(width, height, corTopo, corBase) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = pngChunk('IHDR', ihdrData);

  const rowBytes = width * 3 + 1;
  const raw = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const r = Math.round(corTopo[0] + (corBase[0] - corTopo[0]) * t);
    const g = Math.round(corTopo[1] + (corBase[1] - corTopo[1]) * t);
    const b = Math.round(corTopo[2] + (corBase[2] - corTopo[2]) * t);
    const rowStart = y * rowBytes;
    raw[rowStart] = 0; // sem filtro
    for (let x = 0; x < width; x++) {
      const idx = rowStart + 1 + x * 3;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
    }
  }
  const idat = pngChunk('IDAT', zlib.deflateSync(raw));
  const iend = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const UPLOADS_DIR = 'uploads';

function gravarImagemExemplo(nomeFicheiro, corTopo, corBase) {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const buffer = criarImagemExemplo(480, 320, corTopo, corBase);
  fs.writeFileSync(path.join(UPLOADS_DIR, nomeFicheiro), buffer);
  return nomeFicheiro;
}

// ---------------------------------------------------------------------------
// Imagens de exemplo (cores ilustrativas do problema reportado)
// ---------------------------------------------------------------------------

const imgIluminacao = gravarImagemExemplo('seed-iluminacao.png', [30, 34, 48], [10, 10, 18]);       // rua escura à noite
const imgBuraco = gravarImagemExemplo('seed-buraco-estrada.png', [120, 110, 100], [70, 62, 55]);     // asfalto/terra
const imgLixo1 = gravarImagemExemplo('seed-lixo-1.png', [122, 128, 96], [90, 96, 64]);                // terreno com lixo
const imgLixo2 = gravarImagemExemplo('seed-lixo-2.png', [140, 132, 104], [100, 92, 70]);
const imgSinalizacao = gravarImagemExemplo('seed-sinalizacao.png', [96, 108, 120], [60, 70, 82]);     // cruzamento

// Datas relativas a "agora", para os cálculos de estatísticas (tempo médio de
// resolução, máximo em simultâneo, incidências abertas há muito tempo) terem
// dados realistas para mostrar.
const diasAtras = (n) => new Date(Date.now() - 1000 * 60 * 60 * 24 * n);

// ---------------------------------------------------------------------------
// Utilizadores de demonstração (admin, presidente, 2 membros da assembleia)
// ---------------------------------------------------------------------------
// Passwords fortes (maiúsculas, minúsculas, números e símbolos), fixas para
// que fiquem documentadas e sejam sempre as mesmas entre execuções do seed.
const DEMO_USERS = [
  { name: "Admin Demo", email: "admin.demo@vozfreguesia.pt", password: "Adm1n$eguro!", role: "admin" },
  { name: "Presidente Demo", email: "presidente.demo@vozfreguesia.pt", password: "Pres1dente#Vf", role: "president" },
  { name: "Membro Assembleia 1", email: "assembleia1.demo@vozfreguesia.pt", password: "Assembl3ia#1", role: "assembly" },
  { name: "Membro Assembleia 2", email: "assembleia2.demo@vozfreguesia.pt", password: "Assembl3ia#2", role: "assembly" },
];

async function upsertUser({ name, email, password, role }) {
  const hash = await bcrypt.hash(password, 10);
  return User.findOneAndUpdate(
    { email },
    { name, email, password: hash, role },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seedUsers() {
  // A aplicação só permite um presidente de cada vez. Se já existir um
  // presidente diferente do nosso (ex: criado manualmente), não o substituímos
  // - criamos o "Presidente Demo" como residente para não violar essa regra.
  const presidenteExistente = await User.findOne({
    role: "president",
    email: { $ne: "presidente.demo@vozfreguesia.pt" }
  });
  if (presidenteExistente) {
    console.warn(`⚠ Já existe um presidente ("${presidenteExistente.name}"); "Presidente Demo" foi criado/mantido como residente para não violar a regra de presidente único.`);
  }

  const admin = await upsertUser(DEMO_USERS[0]);
  const presidenteDemo = await upsertUser({
    ...DEMO_USERS[1],
    role: presidenteExistente ? "resident" : "president"
  });
  const assembleia1 = await upsertUser(DEMO_USERS[2]);
  const assembleia2 = await upsertUser(DEMO_USERS[3]);

  // Os exemplos de submissões referem-se sempre a quem É de facto o
  // presidente atual (o já existente, se houver, senão o "Presidente Demo").
  const presidente = presidenteExistente || presidenteDemo;

  return { admin, presidente, assembleia1, assembleia2 };
}

function criarExemplos({ presidente, assembleia1, assembleia2 }) {
  const nomePresidente = presidente.name;

  return [
  // 1) Pendente, anónima, sem anexos - caso mais simples possível
  {
    title: "Iluminação pública avariada na Rua das Flores",
    description: "Há três candeeiros apagados na Rua das Flores desde a semana passada, junto ao parque infantil. À noite fica muito escuro e é inseguro para quem passa a pé.",
    attachments: [imgIluminacao],
    authorName: null,
    authorEmail: null,
    anonymous: true,
    status: "Pending",
    createdAt: diasAtras(2),
    replies: [],
    votesToReject: [],
    auditTrail: [
      { action: "Created", user: "anónimo", timestamp: diasAtras(2) }
    ]
  },

  // 2) Em progresso, identificada, 1 resposta do presidente, sem anexos
  {
    title: "Pedido de banco novo no Largo da Igreja",
    description: "Sugiro a colocação de um banco de jardim no Largo da Igreja, visto ser um ponto de passagem frequente para pessoas mais idosas que precisam de descansar.",
    attachments: [],
    authorName: "Maria Santos",
    authorEmail: "maria.santos@example.com",
    anonymous: false,
    status: "In Progress",
    createdAt: diasAtras(5),
    replies: [
      {
        fromRole: "president",
        authorName: nomePresidente,
        text: "Boa sugestão, Maria. Já incluímos o pedido no orçamento participativo deste trimestre.",
        timestamp: diasAtras(3)
      }
    ],
    votesToReject: [],
    auditTrail: [
      { action: "Created", user: "Maria Santos", timestamp: diasAtras(5) },
      { action: "Reply", user: nomePresidente, timestamp: diasAtras(3) },
      { action: "Status to In Progress", user: nomePresidente, timestamp: diasAtras(3) }
    ]
  },

  // 3) Resolvida, identificada, com imagem (foto do buraco), 1 resposta
  {
    title: "Buraco na estrada próximo do cemitério",
    description: "Existe um buraco grande na estrada principal, perto da entrada do cemitério, que já danificou pelo menos dois pneus de vizinhos.",
    attachments: [imgBuraco],
    authorName: "João Pereira",
    authorEmail: "joao.pereira@example.com",
    anonymous: false,
    status: "Resolved",
    createdAt: diasAtras(10),
    replies: [
      {
        fromRole: "president",
        authorName: nomePresidente,
        text: "Obrigado pelo aviso. A reparação foi feita esta semana pela equipa de manutenção da freguesia.",
        timestamp: diasAtras(1)
      }
    ],
    votesToReject: [],
    auditTrail: [
      { action: "Created", user: "João Pereira", timestamp: diasAtras(10) },
      { action: "Status to In Progress", user: nomePresidente, timestamp: diasAtras(4) },
      { action: "Reply", user: nomePresidente, timestamp: diasAtras(1) },
      { action: "Status to Resolved", user: nomePresidente, timestamp: diasAtras(1) }
    ]
  },

  // 4) Pendente, anónima, com 2 imagens (testa galeria com múltiplos anexos)
  {
    title: "Lixo acumulado em terreno baldio na Travessa do Moinho",
    description: "Há vários sacos de lixo e entulho acumulados há semanas num terreno baldio, a atrair ratos e a cheirar mal. Já é o segundo verão seguido que isto acontece.",
    attachments: [imgLixo1, imgLixo2],
    authorName: null,
    authorEmail: null,
    anonymous: true,
    status: "Pending",
    createdAt: diasAtras(1),
    replies: [],
    votesToReject: [],
    auditTrail: [
      { action: "Created", user: "anónimo", timestamp: diasAtras(1) }
    ]
  },

  // 5) Pendente, identificada, com imagem, aberta há mais de 1 ano
  //    (alimenta as estatísticas "abertas há mais de 1 ano")
  {
    title: "Sinalização de trânsito em falta no cruzamento da Rua Nova",
    description: "O cruzamento entre a Rua Nova e a Avenida Central não tem nenhum sinal de STOP ou cedência de passagem. Já houve dois quase-acidentes este mês.",
    attachments: [imgSinalizacao],
    authorName: "Carlos Mendes",
    authorEmail: "carlos.mendes@example.com",
    anonymous: false,
    status: "Pending",
    createdAt: diasAtras(430),
    replies: [],
    votesToReject: [],
    auditTrail: [
      { action: "Created", user: "Carlos Mendes", timestamp: diasAtras(430) }
    ]
  },

  // 6) Resolvida, identificada, várias respostas (ida e volta residente/presidente), sem anexos
  {
    title: "Fuga de água na rede pública da Rua do Rio",
    description: "Há uma fuga de água visível no passeio da Rua do Rio, com água a escorrer para a estrada há já alguns dias.",
    attachments: [],
    authorName: "Ana Oliveira",
    authorEmail: "ana.oliveira@example.com",
    anonymous: false,
    status: "Resolved",
    createdAt: diasAtras(15),
    replies: [
      {
        fromRole: "president",
        authorName: nomePresidente,
        text: "Obrigado, Ana. Já reportámos à entidade gestora da rede de água.",
        timestamp: diasAtras(14)
      },
      {
        fromRole: "resident",
        authorName: "Ana Oliveira",
        text: "Obrigada pela resposta rápida! A fuga parece ter piorado hoje de manhã.",
        timestamp: diasAtras(12)
      },
      {
        fromRole: "president",
        authorName: nomePresidente,
        text: "A equipa técnica esteve no local hoje e reparou a fuga. Por favor confirme se está tudo bem.",
        timestamp: diasAtras(11)
      },
      {
        fromRole: "resident",
        authorName: "Ana Oliveira",
        text: "Confirmo, já não há água a escorrer. Muito obrigada!",
        timestamp: diasAtras(10)
      }
    ],
    votesToReject: [],
    auditTrail: [
      { action: "Created", user: "Ana Oliveira", timestamp: diasAtras(15) },
      { action: "Reply", user: nomePresidente, timestamp: diasAtras(14) },
      { action: "Status to In Progress", user: nomePresidente, timestamp: diasAtras(14) },
      { action: "Reply", user: "Ana Oliveira", timestamp: diasAtras(12) },
      { action: "Reply", user: nomePresidente, timestamp: diasAtras(11) },
      { action: "Reply", user: "Ana Oliveira", timestamp: diasAtras(10) },
      { action: "Status to Resolved", user: nomePresidente, timestamp: diasAtras(10) }
    ]
  },

  // 7) Pendente, anónima, com proposta de rejeição do presidente ainda não confirmada pela assembleia
  {
    title: "Queixa com linguagem imprópria sobre vizinho",
    description: "[Submissão sinalizada: contém acusações pessoais sem fundamentação factual e linguagem imprópria sobre um vizinho identificado.]",
    attachments: [],
    authorName: null,
    authorEmail: null,
    anonymous: true,
    status: "Pending",
    createdAt: diasAtras(3),
    replies: [],
    votesToReject: [],
    rejectionProposedBy: nomePresidente,
    rejectionProposedAt: diasAtras(1),
    auditTrail: [
      { action: "Created", user: "anónimo", timestamp: diasAtras(3) },
      { action: "Rejection proposed by president", user: nomePresidente, timestamp: diasAtras(1) }
    ]
  },

  // 8) Rejeitada: proposta do presidente, confirmada por toda a assembleia - oculta do público
  {
    title: "Publicação com acusações sem fundamento contra funcionário da junta",
    description: "[Submissão rejeitada: continha acusações graves e infundadas contra um funcionário identificado, sem qualquer evidência de suporte.]",
    attachments: [],
    authorName: null,
    authorEmail: null,
    anonymous: true,
    status: "Rejected",
    createdAt: diasAtras(8),
    replies: [],
    votesToReject: [
      { adminId: assembleia1._id },
      { adminId: assembleia2._id }
    ],
    rejectionProposedBy: nomePresidente,
    rejectionProposedAt: diasAtras(7),
    auditTrail: [
      { action: "Created", user: "anónimo", timestamp: diasAtras(8) },
      { action: "Rejection proposed by president", user: nomePresidente, timestamp: diasAtras(7) },
      { action: "Confirmed rejection", user: assembleia1.name, timestamp: diasAtras(6) },
      { action: "Confirmed rejection", user: assembleia2.name, timestamp: diasAtras(6) },
      { action: "Rejection confirmed by assembly", user: "Assembleia", timestamp: diasAtras(6) }
    ]
  }
  ];
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Ligado ao MongoDB:", process.env.MONGO_URI);

  const utilizadores = await seedUsers();
  console.log("Utilizadores de demonstração prontos:");
  DEMO_USERS.forEach(u => console.log(`  - ${u.role.padEnd(9)} | ${u.email} | ${u.password}`));

  const apagadas = await Submission.deleteMany({});
  console.log(`Submissões anteriores removidas: ${apagadas.deletedCount}`);

  const exemplos = criarExemplos(utilizadores);
  const criadas = await Submission.insertMany(exemplos);
  console.log(`Submissões de exemplo criadas: ${criadas.length}`);
  console.log("Imagens de exemplo escritas em uploads/: seed-iluminacao.png, seed-buraco-estrada.png, seed-lixo-1.png, seed-lixo-2.png, seed-sinalizacao.png");

  await mongoose.disconnect();
  console.log("Concluído.");
}

seed().catch(err => {
  console.error("Erro ao popular submissões de exemplo:", err);
  process.exit(1);
});
