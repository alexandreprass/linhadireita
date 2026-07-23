# Deploy no Render — LINHA DIREITA

## Language
**Node** (não Python)

## Comandos

| Campo | Valor |
|--------|--------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npx prisma db push && npx next start -p $PORT` |

## Variáveis de ambiente (Environment)

Crie estas no painel do serviço:

```
NODE_VERSION=20
XAI_API_KEY=sua_chave_xai
GROK_MODEL=grok-4.5
GROK_IMAGE_MODEL=grok-imagine-image
ADMIN_USER=admin
ADMIN_PASSWORD=84074070
ADMIN_SESSION_SECRET=qualquer-texto-longo-aleatorio
CRON_SECRET=outro-segredo-aleatorio
NEXT_PUBLIC_SITE_URL=https://SEU-SERVICO.onrender.com
MAX_REWRITE_PER_CYCLE=6
```

> **Não precisa de DATABASE_URL** — o projeto usa SQLite embutido (`prisma/linhadireita.db`).  
> Os dados podem zerar se o Render recriar o container. Depois você pode migrar para Postgres.

## Se quiser PostgreSQL (melhor)

1. No Render: New → PostgreSQL  
2. Copie a **Internal Database URL**  
3. Em Environment:
   ```
   DATABASE_URL=postgresql://...
   ```
4. No arquivo `prisma/schema.prisma` troque:
   ```prisma
   provider = "postgresql"
   ```
5. Commit + redeploy

## Admin
- URL: `https://seu-app.onrender.com/admin`
- User: `admin`
- Senha: `84074070` (ou o valor de `ADMIN_PASSWORD`)
