# Cockpit de Gestão de Marketing

Sistema de gestão de reuniões de marketing — Alavancas → Pautas → Estratégia →
Indicadores → Participantes → Definição → Encaminhamentos. Next.js 14 (App
Router) + Supabase (Postgres + Auth).

O código já foi compilado com sucesso (`next build`) antes de ser entregue —
o que falta é **você criar a infraestrutura** (banco de dados e hospedagem) e
apontar o projeto para ela. Leva uns 15–20 minutos, sem precisar programar.

---

## Passo 1 — Criar o projeto no Supabase (banco de dados)

1. Acesse **https://supabase.com**, crie uma conta gratuita e clique em **New project**.
2. Escolha um nome, uma senha para o banco (guarde-a) e a região mais próxima de você.
3. Espere o projeto terminar de provisionar (1–2 minutos).
4. No menu lateral, vá em **SQL Editor** → **New query**.
5. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o conteúdo, cole no editor e clique em **Run**.
6. (Opcional, mas recomendado para começar) Repita o passo 5 com o arquivo `supabase/seed.sql` — ele cria as 4 pautas de exemplo (Indicação, ADS Online, Marca Pessoal, Marketing Estratégico) já com indicadores e participantes, iguais ao protótipo que você validou.
7. Vá em **Authentication → Providers** e confirme que **Email** está habilitado (vem habilitado por padrão).
8. Vá em **Authentication → URL Configuration** e deixe anotado — depois do passo 3 (deploy), volte aqui e preencha **Site URL** e **Redirect URLs** com a URL do seu site (ex: `https://seu-site.vercel.app` e `https://seu-site.vercel.app/auth/callback`).
9. Vá em **Project Settings → API**. Copie dois valores, você vai precisar deles no próximo passo:
   - **Project URL**
   - **anon public key**

## Passo 2 — Subir o código para o GitHub

1. Crie uma conta em **https://github.com** se ainda não tiver.
2. Crie um repositório novo (pode ser privado).
3. Suba os arquivos deste projeto para o repositório (pelo site do GitHub mesmo, arrastando a pasta, ou via `git`:
   ```
   git init
   git add .
   git commit -m "Cockpit de Gestão de Marketing"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
   git push -u origin main
   ```

## Passo 3 — Deploy na Vercel (hospedagem, gratuita)

1. Acesse **https://vercel.com** e crie uma conta (pode entrar direto com o GitHub).
2. Clique em **Add New → Project** e selecione o repositório que você acabou de criar.
3. Na tela de configuração, abra **Environment Variables** e adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` → cole o **Project URL** do Passo 1.9
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → cole o **anon public key** do Passo 1.9
4. Clique em **Deploy**. Em 1–2 minutos você recebe uma URL pública, tipo `https://cockpit-marketing.vercel.app`.
5. Volte ao Supabase (Passo 1.8) e preencha a **Site URL** e **Redirect URLs** com essa URL real.

## Passo 4 — Acessar

Abra a URL da Vercel em qualquer computador, informe seu e-mail — você recebe
um link de acesso (sem senha). A partir daí os dados ficam no banco Postgres
do Supabase: qualquer pessoa da equipe que você convidar acessa os mesmos
dados, de qualquer máquina, e tudo fica salvo automaticamente a cada ação.

Para convidar alguém da equipe: essa versão libera acesso para **qualquer
e-mail que peça o link de acesso** (é assim que o Supabase Auth funciona por
padrão). Se quiser restringir a um domínio específico (ex: só e-mails
`@suaempresa.com`), me avise — é um ajuste pequeno na política de acesso.

---

## Rodando localmente (opcional, para testar/editar antes do deploy)

```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev
```
Abra http://localhost:3000

## Estrutura do projeto

```
app/                  → páginas (Next.js App Router)
  page.tsx            → tela principal (orquestra tudo)
  login/               → tela de login (link mágico por e-mail)
  dashboard/           → (dashboard é renderizado dentro de page.tsx)
components/            → MatrixView, TopicPanel, MeetingFlow, Dashboard, modais
lib/
  supabase/             → clientes Supabase (browser, servidor)
  queries.ts            → todas as leituras/escritas no banco
  types.ts               → tipos e regras (status de indicador, mailto, etc.)
supabase/
  schema.sql              → estrutura do banco (rode primeiro)
  seed.sql                 → dados de demonstração (opcional)
```

## O que ainda não está incluso (próximos passos possíveis)

- Envio automático de e-mail ao criar um encaminhamento (hoje é um botão
  "Enviar e-mail" que abre seu cliente de e-mail pronto para enviar — envio
  automático de verdade exigiria uma Edge Function no Supabase + um serviço
  como Resend ou SendGrid).
- Arrastar-e-soltar para reordenar pautas/alavancas.
- Perfis de usuário com papéis (admin, leitura, etc.) — hoje qualquer pessoa
  autenticada tem acesso total, adequado para um time único.
