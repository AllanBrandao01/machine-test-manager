# Machine Test Scheduler

Sistema de controle de testes de máquinas em turnos industriais, com geração automática de cronograma por frequência, controle de paradas/retomadas e monitoramento operacional em tempo real.

Deploy: [machine-test-manager.vercel.app](https://machine-test-manager.vercel.app)

## Stack

**Frontend** — React (Vite), Styled Components
**Backend** — Node.js, Express
**Banco de dados** — PostgreSQL (via Docker)
**ORM** — Prisma

## Arquitetura

```
machine-test-manager/
├── api/   # Backend (Express + Prisma)
└── web/   # Frontend (React)
```

**Backend** (`api/src/`)
- `routes` — definição dos endpoints
- `controllers` — camada de entrada HTTP
- `services` — regras de negócio
- `domain` — lógica de domínio (timeline e agendamento de testes)
- `utils` — funções auxiliares compartilhadas (turno, horário)

**Frontend** (`web/src/`)
- `features/machines` — domínio principal da aplicação
- `hooks` — controle de estado e fluxo (`useMachinesController`)
- `components` — UI reutilizável
- `services` — comunicação com a API (ou com `localStorage`, no modo demo)
- `utils` — funções auxiliares

## Funcionalidades

- Início de turno com validação de horário (turnos A/C diurnos, B/D noturnos)
- Cadastro de máquinas, com turno herdado automaticamente da sessão ativa
- Geração automática de cronograma de testes a partir da frequência configurada
- Parada de máquina com registro de motivo, e retomada com recálculo do cronograma
- Registro de execução de testes, com opção de desfazer dentro de uma janela curta
- Identificação de testes atrasados e dashboard com indicadores operacionais
- Filtros por status (rodando, parada, atrasada)

## Como rodar o projeto

**Pré-requisitos**: Node.js 18+ e Docker Desktop.

**1. Clonar o repositório**

```bash
git clone https://github.com/AllanBrandao01/machine-test-manager.git
cd machine-test-manager
```

**2. Subir o banco de dados**

```bash
docker compose up -d
```

**3. Configurar e rodar o backend**

```bash
cd api
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

**4. Configurar e rodar o frontend**

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

**5. Acessar**

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Variáveis de ambiente

Cada pacote tem seu próprio `.env.example` com os valores esperados.

**`api/.env`** — string de conexão do PostgreSQL, porta do servidor e origem permitida por CORS.

**`web/.env`** — define `VITE_DATA_MODE`, que controla se o frontend fala com o backend real (`api`) ou funciona isoladamente com `localStorage` (`demo`, usado no deploy do Vercel). `VITE_API_URL` só é usado no modo `api`.

## Comandos úteis do Prisma

```bash
npx prisma generate       # gera o client a partir do schema
npx prisma migrate dev    # cria e aplica uma nova migration (desenvolvimento)
npx prisma migrate deploy # aplica migrations existentes (produção)
npx prisma studio         # abre uma interface visual do banco
```

## Notas técnicas

- A regra de turno (diurno/noturno) é validada tanto no backend quanto no modo demo do frontend, já que são runtimes separados sem módulos compartilhados.
- O turno de uma máquina é sempre herdado da sessão ativa no momento da criação — não é mais um campo editável, para evitar inconsistência entre o turno da máquina e o turno em curso.
- O modo demo (`localStorage`) reimplementa as mesmas regras de negócio do backend, para permitir uso do app sem infraestrutura própria (ex.: Vercel).

## Possíveis melhorias

- Visualização do turno anterior após o início de um novo turno (hoje os dados ficam salvos, mas somem da tela)
- Cobertura de testes automatizados para a lógica de agendamento e validação de turno
- Controle de acesso, caso o uso deixe de ser em uma única estação compartilhada

## Autor

**Allan Brandão**
