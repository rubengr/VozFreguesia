Aplicação de Demonstração React + Node.js

Esta aplicação é um exemplo minimalista de uma arquitetura Frontend (React) e Backend (Node.js/Express).

Para Executar o Backend (Node.js)

Pré-requisitos: Certifique-se de que tem o Node.js e o npm instalados.

Configurar: Coloque o conteúdo de package.json e server.js numa nova pasta (ex: backend).

Instalar Dependências: Abra o terminal na pasta backend e execute:

npm install


Iniciar o Servidor:

npm start
# O servidor estará a correr em http://localhost:3001


Para Executar o Frontend (React)

O frontend React é normalmente gerado com ferramentas como create-react-app ou Vite.

Configurar o Frontend: Crie uma nova pasta para o frontend (ex: frontend) e inicialize um projeto React.

Adicionar o Código: Substitua o conteúdo do seu App.jsx ou componente principal pelo código fornecido.

Iniciar o Cliente:

npm run dev
# ou o comando apropriado para o seu setup (ex: npm run dev)


Quando o backend e o frontend estiverem a correr em simultâneo, o frontend conseguirá fazer o fetch da mensagem do servidor na porta 3001 e exibi-la.