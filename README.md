# Órbita — Netlify + Supabase

O projeto foi adaptado para Next.js 16, Supabase Auth, PostgreSQL e Storage privado. A versão anterior continua no Sites; nenhuma conta ou dado remoto foi apagado.

## Ativar
Leia [o guia de configuração](docs/NETLIFY-SUPABASE.md). É necessário criar o projeto Supabase, aplicar a migração SQL e configurar três variáveis. Sem elas o site abre a tela de configuração, mas não permite login ou acesso a dados.

## Desenvolvimento
Na pasta que contém este package.json:

```powershell
npm ci
Copy-Item .env.example .env.local
# Preencha .env.local com os dados do SEU projeto.
npm run dev
```

Abra http://localhost:3000. Não há login ou banco simulado. Desenvolvimento e produção devem usar projetos Supabase separados se você não quiser misturar dados de teste com dados reais.

## Publicar
O netlify.toml usa npm run build, diretório .next e o adaptador oficial de Next.js. Este repositório tem o aplicativo na raiz; deixe Base directory vazio. Não use dist nem uma regra de SPA que redireciona tudo para index.html.

## Verificar
```powershell
node --test tests/customer-rules.test.mjs tests/workspace-validation.test.mjs tests/company-settings.test.mjs
node tests/supabase-schema.test.mjs
npm run build
```

O teste PostgreSQL usa PGlite em memória com btree_gist; não acessa seu projeto Supabase.

## Segurança e limites atuais
- A sessão é validada pelo Supabase no servidor com getUser. Cabeçalhos oai-authenticated-user-* não são aceitos.
- O ID da empresa vem do usuário verificado; nunca é aceito do formulário. Cada conta ainda representa uma empresa. Equipe compartilhada é uma etapa futura.
- Tabelas usam RLS e não concedem acesso direto aos papéis anon/authenticated. O servidor usa SUPABASE_SECRET_KEY e aplica escopo de empresa em todas as consultas.
- Fotos e logos ficam em bucket privado. A aplicação verifica a empresa antes de servi-los.
- Conflitos de agenda são impedidos por uma restrição de exclusão no PostgreSQL. Atualizações usam controle de versão.
- Não há WhatsApp, IA, pagamentos, exclusão de conta nem compartilhamento de equipe nesta etapa.
- Configurações antigas foram arquivadas em migration/legacy; o backup local antes da alteração é a tag backup-before-netlify-supabase. Arquivos privados de transferência ficam em migration/private, ignorada pelo Git.

Fotos: até 4 MB por arquivo para respeitar o limite de payload binário do Netlify. Logos: até 2 MB.
