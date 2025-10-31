Guia passo-a-passo de setup e execução (Frontend + Backend)

Resumo

- Frontend: Expo / React Native (pasta: frontend)
- Backend: FastAPI + SQLAlchemy (pasta: backend)

1. Pré-requisitos

- Node.js (recomendado >= 16) e npm ou yarn
- Python 3.10+ e virtualenv (opcional, recomendado)
- Git

2. Clonar o repositório (exemplo)
   git clone <REPO_URL>
   cd <repo-folder>

3. Variáveis de ambiente

- Crie um arquivo backend/.env com pelo menos as seguintes variáveis:
  SECRET_KEY=uma-string-secreta
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=1440
  DATABASE_URL=sqlite:///./backend/app.db # opcional; se não setada, o projeto usa sqlite em backend/app.db
  CORS_ORIGINS=http://localhost:8081

4. Backend — instalação e execução local (comandos exatos)

- Criar e ativar virtualenv (Unix/macOS):
  python3 -m venv backend/venv
  source backend/venv/bin/activate

- Windows (PowerShell):
  python -m venv backend\venv
  backend\venv\Scripts\Activate.ps1

- Instalar dependências (se existir requirements.txt):
  pip install -r backend/requirements.txt

  # Se não existir, instale as dependências mínimas:

  pip install fastapi uvicorn sqlalchemy python-dotenv pydantic passlib[bcrypt] python-jose python-multipart

- Rodar o backend (a partir da raiz do projeto):
  uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

- Verificar que está rodando:
  curl http://localhost:8000/

  # deve retornar {"status":"ok","message":"Backend running"}

- Observações:
  - Ao iniciar, o backend criará o arquivo SQLite em backend/app.db se DATABASE_URL não estiver configurada.
  - Uploads são servidos em /media (pasta backend/media)

5. Frontend — instalação e execução local (comandos exatos)

- Ir para a pasta frontend e instalar dependências:
  cd frontend
  npm install

  # ou yarn install

- Rodar o Expo (modo dev):

  # Unix/macOS (define a URL do backend temporariamente):

  EXPO_PUBLIC_API_URL=http://localhost:8000 npm run dev

  # Windows (PowerShell):

  $env:EXPO_PUBLIC_API_URL = "http://localhost:8000"; npm run dev

- Comandos usados no projeto (package.json -> scripts):
  npm run dev # executa: EXPO_NO_TELEMETRY=1 expo start

- Verificar Metro Bundler:
  - Metro deve estar escutando em http://localhost:8081
  - A interface do Expo abrirá no terminal com QR code e links para dispositivos/emuladores

6. Integração Frontend ↔ Backend

- Ajuste a BASE_URL no frontend se necessário. Por padrão o frontend tenta usar EXPO_PUBLIC_API_URL ou http://localhost:5050.
- Endpoints importantes:
  GET /users/me (Bearer) — dados do usuário autenticado
  GET /users/me/profile (Bearer) — retorna perfil detalhado
  PUT /users/me/profile (Bearer) — atualiza informações pessoais (payload: JSON com campos bio, hometown, current_city, relationship_status, contact_email, contact_phone, workplace_company, workplace_title, connections_count, positions, education)

7. Comandos usados no ambiente (DevServerControl)
   No ambiente de desenvolvimento remoto usamos os seguintes comandos por conveniência:

- Comando de setup (rodado uma vez):
  cd frontend && npm install
  (registrado como `set_and_run_setup_command` no DevServerControl)

- Comando do dev server (para rodar e reiniciar):
  cd frontend && npm run dev
  (registrado como `set_dev_command` no DevServerControl)

- Para reiniciar o dev server via DevServerControl, use a ação `restart` e confira os logs retornados.

8. Verificações e troubleshooting rápidas

- Erro: "expo not installed" → executar `cd frontend && npm install`
- Erro: Metro não sobe ou porta 8081 em uso → verifique processos com `lsof -i :8081` (Unix) ou mude porta
- Erro 401 nas chamadas protegidas → verifique header Authorization: Bearer <token>
- Uploads quebrados → confira backend/media e se o backend montou a rota StaticFiles

9. Comandos úteis resumidos (copiar/colar)

# Backend (Unix/macOS)

python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt # ou instale pacotes mínimos
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (Unix/macOS)

cd frontend
npm install
EXPO_PUBLIC_API_URL=http://localhost:8000 npm run dev

# Frontend (Windows PowerShell)

cd frontend
npm install
$env:EXPO_PUBLIC_API_URL = "http://localhost:8000"; npm run dev

10. Próximo passo opcional (posso automatizar para você)

- Criar backend/requirements.txt e adicionar um script no package.json raiz para rodar o backend:
  "backend:dev": "uvicorn backend.main:app --reload --port 8000"
- Implementar o formulário de edição de perfil no frontend e conectar ao endpoint PUT /users/me/profile

Se quiser, atualizo o arquivo SETUP.md com exemplos de .env prontos, adiciono scripts ao package.json raiz, ou implemento o formulário de edição do perfil no frontend agora. Escolha a próxima ação.
