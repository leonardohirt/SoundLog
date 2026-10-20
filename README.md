# Soundlog

Diário musical para registrar avaliações de álbuns e faixas, descobrir ouvintes e organizar listas.

## Desenvolvimento

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env` e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para autenticação e dados na nuvem. A chave anon é pública e depende das políticas RLS da migration.

O Spotify é opcional. Para usar em produção, configure `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET` nas variáveis de ambiente do projeto Vercel e faça um novo deploy. Essas variáveis não usam o prefixo `VITE_` e só são lidas por `api/spotify-token.js`. No `npm run dev`, o endpoint serverless não existe: as buscas usam o catálogo iTunes.

## Supabase

Execute `supabase/migrations/001_secure_rls.sql` uma vez no SQL Editor do projeto Supabase. A migration limpa as políticas atuais, ativa RLS em todas as tabelas do schema `public`, bloqueia tabelas que o app não utiliza e permite leitura pública e escrita autenticada apenas em `profiles`, `reviews` e `follows`.

O banco associa resenhas ao usuário autenticado e preenche os campos de autoria pelo perfil. A sincronização local só envia avaliações pertencentes à sessão atual.

## Scripts

- `npm run dev`: servidor de desenvolvimento Vite.
- `npm run build`: build de produção.
- `npm run preview`: pré-visualização do build.
- `npm run lint`: Oxlint.

Ao migrar para produção, revogue e substitua qualquer credencial Spotify que já tenha sido exposta em código ou commit. Configure o novo segredo apenas no ambiente da Vercel e no `.env` local ignorado pelo Git.