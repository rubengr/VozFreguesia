# Publicar a Voz da Freguesia (Oracle Cloud - Always Free)

Guia para colocar a aplicação acessível online, de forma gratuita e sempre
ativa (sem "adormecer"), usando o nível Always Free da Oracle Cloud. É mais
trabalho manual do que um serviço como o Render ou o Railway, mas não custa
nada e fica sempre disponível para quem testar, a qualquer hora.

Arquitetura final:

```
Browser de quem testa (em qualquer computador, na Internet)
        │  HTTPS
        ▼
┌─────────────────────── Servidor Oracle (a VM) ───────────────────────┐
│                                                                        │
│   Nginx (porta 443)                                                   │
│   ├── serve o build do React (ficheiros estáticos, gerados na VM)     │
│   └── reencaminha /api e /uploads  →  Node.js (porta 4000)            │
│                                         (os dois correm nesta mesma    │
│                                          VM; comunicam internamente,   │
│                                          daí "localhost" = a própria   │
│                                          VM, nunca o seu computador)   │
└───────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                 MongoDB Atlas (serviço externo, free tier)
```

Tudo o que está dentro da caixa "Servidor Oracle" corre na VM, incluindo o
frontend já construído. Frontend e backend ficam no mesmo domínio (o Nginx
é a única porta de entrada), por isso não há problemas de CORS nem é
preciso gerir dois endereços separados. Só a base de dados fica fora,
no MongoDB Atlas.

---

## 1. Criar a conta e a máquina na Oracle Cloud

1. Crie uma conta em [cloud.oracle.com](https://cloud.oracle.com) (pede cartão para verificação, mas os recursos "Always Free" nunca são cobrados).
2. No menu, vá a **Compute → Instances → Create Instance**.
3. Em "Image and shape", escolha:
   - **Imagem**: Ubuntu 22.04 (ou mais recente)
   - **Shape**: `VM.Standard.A1.Flex` (Ampere, ARM) — marque como "Always Free eligible". Configure 2 OCPU / 12 GB RAM (ou o máximo que o seu tenant permitir gratuitamente).
4. Em "Add SSH keys", gere ou cole a sua chave pública (vai precisar da privada para entrar por SSH depois).
5. Clique em **Create**.

> Se aparecer "Out of host capacity" na região escolhida, tente novamente mais tarde, mude de "Availability Domain", ou tente noutra região da sua conta. É um problema conhecido do nível gratuito da Oracle em regiões populares - não é um erro seu.

Depois de criada, anote o **IP público** da instância.

---

## 2. Abrir as portas (duplo firewall da Oracle - fácil de esquecer)

A Oracle bloqueia tráfego em **dois sítios diferentes**; tem de abrir em ambos:

**a) Security List da VCN** (consola web):
Vá a **Networking → Virtual Cloud Networks → (a sua VCN) → Security Lists → Default Security List → Add Ingress Rules**, e adicione regras para `0.0.0.0/0` nas portas **80** (HTTP) e **443** (HTTPS).

**b) Firewall do próprio Ubuntu** (por SSH, depois de entrar na máquina):
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## 3. Preparar a máquina

Entre por SSH:
```bash
ssh -i /caminho/para/a/sua/chave ubuntu@SEU_IP_PUBLICO
```

> **A partir daqui, até ao final do guia (passos 3 a 9), todos os comandos
> correm dentro desta sessão SSH — ou seja, no próprio servidor Oracle, não
> no seu computador.** O seu Mac só serve para abrir esta ligação; depois de
> entrar, está "dentro" da VM remota. O passo 4 (criar a conta no Atlas) é
> feito no browser do seu computador, mas assim que voltar ao terminal já
> continua na mesma sessão SSH de antes - não precisa de voltar a entrar.

Instale o Node.js, Git, Nginx e o PM2 (mantém o backend sempre a correr e reinicia-o sozinho se cair ou se a máquina reiniciar):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
sudo npm install -g pm2
```

---

## 4. Base de dados (MongoDB Atlas)

Use o MongoDB Atlas (free tier M0), já documentado no [README](README.md#instalar-o-mongodb-apenas-se-não-usar-o-mongodb-atlas) - mais simples do que instalar e gerir o MongoDB na mesma máquina pequena. Crie o cluster gratuito, um utilizador de base de dados, e copie a connection string (`mongodb+srv://...`).

---

## 5. Clonar e configurar o backend

> Ainda na sessão SSH, na VM.

```bash
git clone <url-do-seu-repositorio>
cd VozFreguesia/backend
npm install --production
cp .env.example .env
nano .env
```

Preencha o `.env` com os valores de produção:
```
PORT=4000
MONGO_URI=mongodb+srv://.../vozfreguesia
JWT_SECRET=uma-string-aleatoria-longa-e-só-sua
NODE_ENV=production
FRONTEND_URL=https://o-seu-dominio-ou-IP

# Opcional, para notificações por email
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Arranque o backend com o PM2 e configure-o para iniciar sozinho a seguir a um reboot da máquina:
```bash
pm2 start app.js --name voz-freguesia-backend
pm2 save
pm2 startup   # corra o comando que este passo lhe indicar (precisa de sudo)
```

---

## 6. Build do frontend

> Ainda na sessão SSH, na VM — este build gera os ficheiros que o Nginx vai
> servir a partir do próprio servidor, não do seu computador.

```bash
cd ../frontend
npm install
REACT_APP_API_URL="" npm run build
```

`REACT_APP_API_URL=""` faz o frontend chamar a API com caminhos relativos
(ex: `/api/...`), porque o Nginx vai servir tudo no mesmo domínio - não é
preciso apontar para `http://IP:4000`.

Isto gera a pasta `frontend/build/` com os ficheiros estáticos otimizados.

---

## 7. Configurar o Nginx

```bash
sudo nano /etc/nginx/sites-available/voz-freguesia
```

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO_OU_IP;

    # Ficheiros estáticos do React
    root /home/ubuntu/VozFreguesia/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # API e anexos -> backend Node.js
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        proxy_pass http://localhost:4000;
    }
}
```

Ative e reinicie:
```bash
sudo ln -s /etc/nginx/sites-available/voz-freguesia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Neste momento já consegue abrir `http://SEU_IP_PUBLICO` no browser.

---

## 8. HTTPS (recomendado, para os browsers não avisarem "não seguro")

Se não tiver um domínio, registe um gratuito (ex: [duckdns.org](https://www.duckdns.org)) a apontar para o IP público da instância. Depois:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d o-seu-dominio.duckdns.org
```

O certbot edita o Nginx automaticamente e renova o certificado sozinho.
Depois de ter HTTPS, atualize `FRONTEND_URL` no `.env` do backend para
`https://o-seu-dominio...` e reinicie o backend: `pm2 restart voz-freguesia-backend`.

---

## 9. Atualizar a aplicação no futuro

```bash
cd ~/VozFreguesia
git pull
cd backend && npm install --production && pm2 restart voz-freguesia-backend
cd ../frontend && npm install && REACT_APP_API_URL="" npm run build
```

(O Nginx não precisa de reiniciar - serve sempre o conteúdo atual da pasta `build/`.)

---

## Checklist de problemas comuns

- **Página não abre**: confirme as regras de porta 80/443 tanto na Security List da Oracle como no `iptables` da máquina (passo 2).
- **Frontend abre mas os pedidos falham**: confirme que fez o build com `REACT_APP_API_URL=""` e que o Nginx está a reencaminhar `/api/` e `/uploads/` corretamente (`sudo nginx -t`, depois veja os logs com `sudo tail -f /var/log/nginx/error.log`).
- **Backend não arranca**: veja os logs com `pm2 logs voz-freguesia-backend`.
- **Login falha / sessão não persiste**: confirme que `FRONTEND_URL` no `.env` do backend corresponde exatamente ao domínio usado no browser, e que `NODE_ENV=production` está definido (necessário para o cookie `secure` funcionar sobre HTTPS).
