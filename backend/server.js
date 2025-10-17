// server.js - Backend Node.js

const express = require('express');
const cors = require('cors'); // Necessário para permitir que o frontend React aceda
const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de Teste Simples (o frontend tenta aceder a esta)
app.get('/api/mensagem', (req, res) => {
// Retorna um objeto JSON com uma mensagem
res.json({
mensagem: 'Olá do Servidor Node.js/Express! O backend está a funcionar corretamente.',
data: new Date().toLocaleString('pt-PT')
});
});

// Mensagem de confirmação que o servidor iniciou
app.listen(PORT, () => {
    console.log(`Servidor Express a correr em http://localhost:${PORT}`);
    console.log('Use CTRL+C para parar o servidor.');
});

// Para executar este ficheiro num ambiente real, precisa de ter o Node.js instalado
// e usar o comando: node server.js