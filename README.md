# Voz da Freguesia

Aplicação web para submissão e acompanhamento de queixas/sugestões de residentes de uma freguesia, com fluxo de aprovação entre residentes, presidente e administradores.

Arquitetura:
- **Backend**: Node.js + Express + MongoDB (Mongoose), autenticação por cookie JWT.
- **Frontend**: React (Create React App) + React Router + Axios.

> Para publicar a aplicação online (ex: para outras pessoas testarem), veja [DEPLOY.md](DEPLOY.md).

---

## Pré-requisitos

Instale em qualquer sistema operativo (Windows ou Mac):

1. **Node.js** (versão 18 ou superior) e npm — vêm juntos.
2. **MongoDB** — localmente ou através do [MongoDB Atlas](https://www.mongodb.com/atlas) (gratuito, mais simples pois evita instalar o MongoDB localmente).
3. **Git** (para clonar o repositório).

### Instalar o Node.js

- **Windows**: descarregue o instalador LTS em [nodejs.org](https://nodejs.org) e execute-o, ou use `winget install OpenJS.NodeJS.LTS`.
- **Mac**: `brew install node` (requer [Homebrew](https://brew.sh)), ou descarregue o instalador em [nodejs.org](https://nodejs.org).

Confirme a instalação em qualquer terminal:

```bash
node -v
npm -v
```

### Instalar o MongoDB (apenas se não usar o MongoDB Atlas)

- **Windows**: descarregue o "MongoDB Community Server" em [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) e instale como serviço (inicia automaticamente).
- **Mac**:
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```

Se preferir não instalar nada, crie um cluster gratuito no MongoDB Atlas e use a connection string fornecida (ver secção seguinte).

---

## Configuração

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd VozFreguesia
```

### 2. Configurar variáveis de ambiente do backend

Dentro da pasta `backend`, crie um ficheiro `.env` a partir do exemplo fornecido:

**Mac/Linux:**
```bash
cd backend
cp .env.example .env
```

**Windows (cmd ou PowerShell):**
```cmd
cd backend
copy .env.example .env
```

Depois edite o `.env` com um editor de texto. Valores por defeito:

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/vozfreguesia
JWT_SECRET=troque-isto-por-uma-chave-secreta-aleatoria
```

- Se usar o MongoDB Atlas, substitua `MONGO_URI` pela connection string do cluster (algo como `mongodb+srv://utilizador:password@cluster.mongodb.net/vozfreguesia`).
- `JWT_SECRET` deve ser uma string aleatória própria — usada para assinar os tokens de autenticação.

---

## Executar o Backend

Num terminal, a partir da pasta `backend`:

```bash
cd backend
npm install
npm start
```

O servidor arranca em `http://localhost:4000` (ou na porta definida em `PORT`) e liga-se ao MongoDB configurado em `MONGO_URI`.

Ao iniciar por 1ª vez, é criada automaticamente uma conta de administrador:
- **Email:** `admin@admin.com`
- **Password:** `admin123`

> Recomenda-se alterar esta password após o primeiro login (através do painel de administração).

### Dados de exemplo (opcional)

Para popular a base de dados com algumas submissões de exemplo (útil para testar a aplicação sem ter de criar tudo manualmente):

```bash
cd backend
npm run seed
```

> Atenção: este script apaga todas as submissões existentes antes de criar as de exemplo. Corre-o apenas em ambiente de desenvolvimento/teste.

O mesmo script cria (ou atualiza, se já existirem) 4 contas de demonstração, uma por cada papel da aplicação, com passwords fortes (maiúsculas, minúsculas, números e símbolos):

| Papel | Email | Password |
|---|---|---|
| Administrador | `admin.demo@vozfreguesia.pt` | `Adm1n$eguro!` |
| Presidente | `presidente.demo@vozfreguesia.pt` | `Pres1dente#Vf` |
| Assembleia | `assembleia1.demo@vozfreguesia.pt` | `Assembl3ia#1` |
| Assembleia | `assembleia2.demo@vozfreguesia.pt` | `Assembl3ia#2` |

> A aplicação só permite um presidente de cada vez. Se já existir um presidente diferente deste quando o seed corre, a conta `presidente.demo@...` é criada como residente em vez de presidente (para não violar essa regra), e os exemplos de submissões passam a referir-se ao presidente já existente. Veja o aviso no terminal ao correr o seed para confirmar qual ficou ativo.

### Notificações por email (opcional)

Quando o presidente responde a uma submissão, o autor (se tiver indicado email e não for anónimo) recebe uma notificação por email através do [Resend](https://resend.com) (serviço gratuito, até 100 emails/dia).

1. Crie uma conta gratuita em [resend.com](https://resend.com).
2. Gere uma API Key no painel do Resend.
3. No `.env` do backend, defina:
   ```
   RESEND_API_KEY=a-sua-api-key
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```
   `onboarding@resend.dev` funciona para testes sem verificar domínio. Para produção, verifique o seu próprio domínio no Resend e use um endereço desse domínio.

Se `RESEND_API_KEY` não estiver definida, as notificações são simplesmente ignoradas (a aplicação continua a funcionar normalmente).

---

## Executar o Frontend

Num **segundo terminal** (deixe o backend a correr no primeiro), a partir da pasta `frontend`:

```bash
cd frontend
npm install
npm start
```

A aplicação React abre automaticamente em `http://localhost:3000` e comunica com o backend em `http://localhost:4000`.

> Os dois servidores (backend na porta 4000, frontend na porta 3000) têm de estar a correr em simultâneo.

### Build de produção do frontend

```bash
cd frontend
npm run build
```

Gera uma pasta `build/` com os ficheiros estáticos otimizados, prontos a servir por qualquer servidor web.

---

## Resumo rápido (depois da configuração inicial)

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm start
```

---

## Resolução de problemas comuns

- **`MongoNetworkError` / falha a ligar ao MongoDB**: confirme que o serviço MongoDB está a correr localmente (`brew services list` no Mac, ou "Services" no Windows) ou que a `MONGO_URI` do Atlas está correta e o IP está na whitelist do cluster.
- **Erro de CORS no browser**: o backend só aceita pedidos vindos de `http://localhost:3000`. Garanta que o frontend corre exatamente nessa porta.
- **Login falha sempre**: confirme que o backend está a correr na porta 4000 — o frontend assume esse endereço fixo (`http://localhost:4000`).
- **Porta já em uso**: altere `PORT` no `.env` do backend (e o endereço correspondente no frontend, em `frontend/src`) se a porta 4000 já estiver ocupada.
