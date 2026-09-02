# Órbita: piloto da vidraçaria

## Entrega atual

Clientes, configuração da empresa, pedidos, agenda, fotos e histórico de alterações são persistidos no servidor. A identidade vem da sessão autenticada do Sites; a API rejeita solicitações sem identidade. Cada conta mantém sua própria empresa/base. Não há compartilhamento de uma empresa entre funcionários nesta etapa.

Pedidos têm cliente, serviço, descrição, medidas informadas, responsável, endereço da obra e etapa. Aceitam até 5 fotos JPEG/PNG/WebP de até 5 MB cada. Os arquivos ficam no armazenamento de objetos; o acesso é autorizado por conta.

A agenda permite data, tipo, duração e local, preserva o endereço do agendamento e oferece rota no Maps para visitas externas. Nesta etapa, considera uma equipe, expediente de 09:00 a 18:00 e fuso America/Sao_Paulo. Conflitos são bloqueados atomicamente no banco. Edições usam versões para evitar sobrescrita silenciosa.

## Executar localmente

Nesta pasta, com Node.js 22.13 ou superior:

```powershell
npm ci
npx wrangler d1 migrations apply DB --local --config wrangler.local.json
npm run dev
```

Abra o endereço indicado. O botão Entrar com ChatGPT aciona o simulador local do Sites (local_seedy). Isso não usa credenciais de produção. Banco e arquivos locais ficam em .wrangler/state e são separados do site publicado.

## Verificações

```powershell
node --test tests/customer-rules.test.mjs tests/workspace-validation.test.mjs
python tests/persistence.test.py
node tests/api-smoke.mjs
npx tsc --noEmit --incremental false
npm run build
```

O teste api-smoke requer o servidor local e cria fixtures identificadas como teste local. Não execute em produção. O teste de banco usa SQLite em memória e a migração real. A aplicação não insere dados fictícios no banco publicado.

## Banco e publicação

D1 armazena registros; R2 armazena fotos. Migrations estão em drizzle e devem ser geradas por drizzle-kit a partir de db/schema.ts. A migração inicial contém também triggers de conflito de agenda, limite de fotos e auditoria. Preservar esses triggers em futuras reconstruções de tabelas. Nunca editar uma migração já aplicada; criar uma nova.

O aplicativo tem repositório próprio em app. Planejamento fica em docs, na pasta superior. A publicação mantém acesso privado pelo Sites. APIs usam consultas parametrizadas, validação de origem nas mutações e filtragem pela conta autenticada.

## Próximos incrementos

Orçamento com itens e valores; vínculo entre pedido e instalação; edição/remarcação de agenda e endereços por obra; equipe com permissões; exclusão/retificação de fotos; WhatsApp; IA; backups com procedimento de restauração e políticas de retenção.

WhatsApp e IA ainda não estão conectados. O painel mostra cálculos dos registros, não análise por um modelo de IA. O pedido ainda não é um orçamento financeiro.

Antes de ampliar para um piloto com dados sensíveis ou vários usuários, revisar as dependências e os processos de privacidade, recuperação e suporte. O instalador reportou 14 vulnerabilidades (6 moderadas e 8 altas); não foi aplicada atualização forçada.

## Empresa e Configurações

A empresa possui nome, ramo, telefone, e-mail de contato, endereço opcional, logo privado em R2 e forma de atendimento independente do ramo. Configurações são armazenadas em companies.settings, com controle de versão; logo usa companies.logo_key. A migração 0001 acrescenta colunas opcionais sem mudar dados anteriores.

Serviços podem ser cadastrados, editados e desativados (até 50; duração de 5 a 480 minutos). A agenda usa o nome e a duração salvos no servidor, rejeita serviços de outra empresa ou inativos e impede novos atendimentos fora do expediente, em dias fechados ou sobre o intervalo. Horários têm um expediente e um intervalo opcional por dia, sem atravessar a meia-noite. Fuso selecionável entre São Paulo, Manaus, Rio Branco e Fernando de Noronha. Agendamentos antigos preservam suas datas, horas, nomes de serviço e durações.

Empresas ainda sem configurações mantêm o expediente anterior de 09:00 a 18:00 em todos os dias até personalização. Catálogo vazio permite atendimento de duração manual. Um catálogo inteiramente desativado bloqueia novos agendamentos. Continua existindo uma agenda compartilhada para uma equipe, sem agendas individuais nesta etapa. O e-mail de contato não modifica o login.

Validação das configurações: node --test tests/company-settings.test.mjs. As limitações antigas de horários fixos e serviços fixos descritas acima foram substituídas por estas configurações.
