## 🏭 Machine Test Scheduler
Sistema para gerenciamento de testes de máquinas em turnos industriais (12h), com controle de execução, paradas, retomadas e monitoramento operacional em tempo real.

## 🚀 Tecnologias

**Frontend**
- React (Vite)
- Styled Components
  
**Backend**
- Node.js
- Express
  
**Banco de Dados**
- PostgreSQL (via Docker)
  
**ORM**
- Prisma (v6.x)

 ## 🏗️ Arquitetura
O projeto segue uma separação clara entre frontend e backend:

machine-test-scheduler/

├── web/   # Frontend (React)

└── api/   # Backend (Node + Prisma)

#### Backend
- Routes → definição dos endpoints
- Controllers → camada de entrada HTTP
- Services → regras de negócio
- Domain → lógica de domínio (timeline e schedule)
- Prisma → acesso ao banco de dados
- 
#### Frontend
- features/machines → domínio principal da aplicação
- hooks → controle de estado e fluxo (useMachinesController)
- components → UI
- services → comunicação com API
- utils → funções auxiliares

## ⚙️ Funcionalidades
- Cadastro de máquinas
- Geração automática de testes baseada em frequência
- Controle de turnos (A, B, C, D)
- Parada de máquina com registro de motivo
- Retomada de máquina com recálculo de cronograma
- Registro de execução de testes
- Identificação de testes atrasados
- Dashboard com indicadores operacionais
- Filtros por status (rodando, parada, atrasada)

## ▶️ Como rodar o projeto
**Pré-requisitos**
- Node.js (>= 18)
- Docker Desktop

***1. Clonar o repositório***
git clone https://github.com/AllanBrandao01/machine-test-manager
- cd machine-test-scheduler

***2. Subir o banco de dados***
- docker compose up -d

***3. Rodar o backend***

- cd api
- npm install
- npx prisma generate
- npx prisma migrate deploy
- npm run dev

***4. Rodar o frontend***

- cd web
- npm install
- npm run dev

***5. Acessar***

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🔐 Variáveis de ambiente
***Backend (api/.env)***

DATABASE_URL="postgresql://user:password@localhost:5432/machine_test_scheduler"
PORT=3001

## 🗄️ Prisma

Comandos úteis:
- npx prisma generate
- npx prisma migrate dev
- npx prisma migrate deploy
- npx prisma studio

## 📌 Observações Técnicas
- O banco de dados é executado via Docker para padronização do ambiente
- A lógica de negócio está centralizada no backend, evitando inconsistências entre cliente e servidor
- O frontend segue organização por feature, facilitando escalabilidade e manutenção
- O estado da aplicação é controlado via hook central (useMachinesController)

## 📈 Possíveis melhorias
- Evoluir a experiência de criação de máquinas utilizando modal dedicado, reduzindo poluição visual na tela principal
- Reduzir a densidade de informação dos cards, exibindo apenas dados essenciais e movendo detalhes para uma visualização expandida
- Melhorar a escalabilidade visual da listagem de máquinas, garantindo consistência de tamanho e alinhamento entre múltiplos cards
- Refinar a responsividade do layout, principalmente na grid de cards e distribuição de ações
- Evoluir o design para um padrão mais orientado a dashboards operacionais, priorizando leitura rápida e tomada de decisão

 ## 👨‍💻 Autor

**Allan Brandão**
