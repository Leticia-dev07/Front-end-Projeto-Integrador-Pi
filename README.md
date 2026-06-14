# 🎓 AcadFlow — Gestão de Atividades Complementares

Sistema web para gerenciamento de atividades complementares acadêmicas. Permite que alunos submetam certificados, coordenadores avaliem submissões e administradores gerenciem cursos e usuários — tudo em uma SPA progressiva (PWA) sem dependências de framework.

link do front: https://leticia-dev07.github.io/Front-end-Projeto-Integrador-Pi/#
---

## ✨ Funcionalidades

### 👨‍🎓 Aluno
- Dashboard com resumo de horas cumpridas e progresso por categoria
- Submissão de certificados com upload de arquivo e dados OCR opcionais
- Histórico de submissões com status (Pendente / Aprovado / Rejeitado)
- Visualização de observações do coordenador

### 👩‍💼 Coordenador
- Dashboard com métricas do seu curso
- Avaliação de submissões (aprovar / rejeitar com observação)
- Gerenciamento de categorias de atividades por curso
- Listagem de alunos vinculados ao curso

### 🛡️ Super Admin
- Gestão completa de cursos, coordenadores e alunos
- Visualização detalhada por curso
- Criação e remoção de usuários em todos os papéis

---

## 🏗️ Arquitetura

Aplicação **SPA vanilla** (HTML + CSS + JavaScript puro), sem bundler nem framework. Toda a lógica é carregada via `<script>` tags no `index.html`.

```
acadflow/
├── index.html                  # Entry point — carrega todos os scripts
├── manifest.json               # Manifesto PWA
├── sw.js                       # Service Worker (cache-first + network-first)
│
├── assets/
│   ├── css/
│   │   ├── variables.css       # Tokens de design (cores, espaçamento, tipografia)
│   │   ├── reset.css           # Reset de estilos
│   │   ├── layout.css          # Shell, sidebar, navbar, grid
│   │   ├── components.css      # Botões, cards, tabelas, formulários...
│   │   ├── animations.css      # Keyframes e classes de transição
│   │   └── responsive.css      # Breakpoints mobile
│   └── js/
│       └── app.js              # Bootstrap: tema, PWA, rotas, sessão
│
├── utils/
│   ├── router.js               # Roteador hash-based com parâmetros dinâmicos
│   ├── storage.js              # Wrapper de sessionStorage (sessão + curso ativo)
│   ├── helpers.js              # Funções utilitárias (initials, datas, etc.)
│   ├── validators.js           # Validação de formulários
│   └── theme.js                # Alternância claro/escuro
│
├── services/
│   ├── api.js                  # Camada HTTP base com JWT automático
│   ├── authService.js          # Login, enriquecimento de sessão, logout
│   ├── userService.js          # CRUD de alunos, coordenadores e cursos
│   ├── activityService.js      # Submissões, categorias, aprovação/rejeição
│   └── dashboardService.js     # Dados agregados para dashboards
│
├── components/
│   ├── card/                   # Componente de card reutilizável
│   ├── loader/                 # Skeleton loader e page loader
│   ├── modal/                  # Modal genérico
│   ├── navbar/                 # Barra de navegação com breadcrumb
│   ├── sidebar/                # Sidebar responsiva com menu mobile
│   ├── table/                  # Tabela com paginação e ordenação
│   └── toast/                  # Notificações toast (success/error/info)
│
├── pages/
│   ├── login/                  # Tela de autenticação
│   ├── aluno/                  # dashboard, submeter, histórico
│   ├── coordenador/            # dashboard, submissoes, categorias, alunos, curso-detalhe
│   ├── superadmin/             # dashboard, cursos, curso-detalhe, coordenadores, alunos
│   └── perfil/                 # Edição de perfil
│
└── pwa/
    ├── icon.svg
    ├── icon-192.png
    └── icon-512.png
```

---

## 🔐 Autenticação e Perfis

O sistema usa **JWT** com três papéis (`role`):

| Role | Rota padrão | Acesso |
|---|---|---|
| `ADMIN` | `/superadmin/dashboard` | Gestão global |
| `COORDENADOR` | `/coordenador/dashboard` | Gestão do seu curso |
| `ALUNO` | `/aluno/dashboard` | Submissão e histórico |

O roteador impede acesso a rotas fora do perfil do usuário. Tokens expirados redirecionam automaticamente para o login.

---

## 🌐 API

A aplicação consome uma API REST hospedada em:

```
https://back-end-projeto-integrador.onrender.com
```

Principais endpoints utilizados:

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Autenticação |
| `GET` | `/alunos` | Lista alunos |
| `GET` | `/coordenadores` | Lista coordenadores |
| `GET` | `/categorias` | Lista categorias |
| `GET` | `/submissoes?cursoId=X` | Submissões por curso |
| `POST` | `/submissoes` | Enviar certificado (multipart) |
| `PUT` | `/submissoes/:id/aprovar` | Aprovar submissão |
| `PUT` | `/submissoes/:id/rejeitar` | Rejeitar com observação |

A camada `services/api.js` injeta o token JWT automaticamente em todas as requisições autenticadas.

---

## 📱 PWA

O AcadFlow é instalável como Progressive Web App:

- **Cache-first** para todos os assets estáticos (CSS, JS, HTML)
- **Network-first** para chamadas à API (sem cache de dados dinâmicos)
- Fallback para `index.html` em modo offline (SPA navigation)
- Banner de instalação nativo com `beforeinstallprompt`
- Atalhos de tela inicial para Dashboard e Submeter Certificado

---

## 🚀 Como executar

Não há etapa de build. Basta servir os arquivos estáticos com qualquer servidor HTTP:

```bash
# Com Python
python3 -m http.server 3000

# Com Node.js (npx)
npx serve .

# Com VS Code
# Instale a extensão Live Server e clique em "Go Live"
```

Acesse `http://localhost:3000` no navegador.

> ⚠️ O Service Worker exige HTTPS ou `localhost` para funcionar. Em produção, faça o deploy atrás de um servidor com TLS.

---

## 🎨 Design System

As variáveis de design ficam em `assets/css/variables.css` e cobrem:

- **Cores**: paleta primária azul (`--primary`), tons de superfície e texto para modo claro e escuro
- **Tipografia**: fonte `Sora` para UI, `JetBrains Mono` para dados
- **Espaçamento**: escala de 4px (`--space-1` a `--space-16`)
- **Bordas e sombras**: raios e elevações padronizados
- **Modo escuro**: alternado via atributo `data-theme="dark"` no `<html>`

---

## 📦 Dependências externas (CDN)

| Biblioteca | Versão | Uso |
|---|---|---|
| Font Awesome | 6.5.0 | Ícones |
| Google Fonts (Sora + JetBrains Mono) | — | Tipografia |

Nenhuma dependência de runtime JavaScript externa. Zero `node_modules` necessários para rodar.

---

## 🗂️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES2020+ (vanilla)
- **Arquitetura**: SPA hash-router sem framework
- **PWA**: Service Worker com Workbox-like manual
- **Backend**: API REST Java/Spring Boot (repositório separado)
- **Autenticação**: JWT Bearer Token
