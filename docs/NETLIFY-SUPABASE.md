# Ativação no Netlify e Supabase

## 1. Criar o projeto Supabase
Abra https://supabase.com/dashboard e crie um projeto. Guarde a senha do banco no seu gerenciador; este aplicativo usa as APIs HTTP e não precisa dessa senha.

No SQL Editor, execute o arquivo supabase/migrations/202609020001_orbita.sql uma única vez em um projeto novo. A migração cria tabelas, restrições, funções e o bucket privado orbita-files. Não execute sobre um banco que já tenha tabelas com esses nomes.

## 2. Variáveis
No Supabase, obtenha Project URL, publishable key e secret key. Também são aceitas as chaves antigas anon e service_role nos campos correspondentes.

Configure no Netlify (Project configuration → Environment variables):
- NEXT_PUBLIC_SUPABASE_URL: URL do projeto.
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: chave pública publishable (ou anon).
- SUPABASE_SECRET_KEY: chave secret (ou service_role). Marque como segredo e disponibilize apenas para Functions/runtime. Nunca crie uma variável NEXT_PUBLIC para essa chave.
- NEXT_PUBLIC_SITE_URL: https://gestaoai.netlify.app

As variáveis NEXT_PUBLIC precisam estar disponíveis durante o build. Para executar no computador, copie .env.example para .env.local e preencha os mesmos nomes. Não coloque chaves em commits, capturas de tela ou mensagens públicas. Não é necessário enviar a chave secreta para o chat.

## 3. Login e e-mails
No Supabase Authentication:
- Ative o provedor Email e a confirmação de e-mail.
- Defina senha mínima de 12 caracteres.
- Site URL: https://gestaoai.netlify.app
- Redirect URLs: https://gestaoai.netlify.app/auth/confirm e https://gestaoai.netlify.app/auth/confirm?recovery=1
- Para testes locais: http://localhost:3000/auth/confirm e http://localhost:3000/auth/confirm?recovery=1
- Configure SMTP próprio para envio a usuários reais. O serviço de e-mail padrão do Supabase tem restrições e limites; não considere o envio em produção ativado sem verificar isso.

Cadastro e recuperação usam PKCE. Abra o link de confirmação no mesmo navegador que iniciou a solicitação. A rota /auth/confirm troca o código por uma sessão; a recuperação termina em /redefinir-senha. Não coloque segredos em URLs.

## 4. Netlify
O aplicativo está na raiz do repositório https://github.com/SnitramVinicius/gestao:
- Production branch: master, se mantida a configuração atual.
- Base directory: vazio.
- Build: npm run build.
- Publish: .next.
- Node: 24.

O netlify.toml contém o adaptador oficial @netlify/plugin-nextjs. Faça novo deploy após definir variáveis. Não publique apenas os arquivos de dist/client da versão antiga.

## 5. Dados anteriores
A origem Sites continua intacta. Um retrato privado dos registros publicados foi salvo em migration/private/sites-export.json. No momento do retrato havia uma empresa e nenhum cliente, pedido, agendamento ou foto.

Depois de criar e confirmar a conta de destino, obtenha o ID do usuário em Authentication → Users. O script abaixo importa SOMENTE a empresa do retrato e recusa sobrescrever uma empresa existente:
```powershell
node --env-file=.env.local scripts/import-legacy-company.mjs UUID-DO-USUARIO
# Confira o destino. Para aplicar:
node --env-file=.env.local scripts/import-legacy-company.mjs UUID-DO-USUARIO --apply
```

Se você já entrou e o aplicativo criou a empresa de destino, configure-a pela tela Empresa; o script não sobrescreve os dados. Se houver novos dados na origem após o retrato, faça novo levantamento antes de transferir. O banco LOCAL antigo permanece em .wrangler/state; ele é separado da origem publicada e não foi convertido automaticamente.

## 6. Verificação final
Com o projeto configurado: cadastrar e confirmar uma conta, entrar, editar a empresa, cadastrar cliente e serviço, agendar, conferir conflito de horário, enviar uma foto e sair. Fazer o teste também com uma segunda conta para confirmar a separação das empresas. A validação automatizada local não substitui esse teste contra o projeto real.

## Voltar à versão anterior
O site do Sites não foi alterado. O código anterior está na tag backup-before-netlify-supabase; use uma cópia separada dessa tag se precisar consultá-lo. Não execute reset destrutivo sobre trabalho novo.
