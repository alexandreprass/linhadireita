# Deploy no Render — LINHA DIREITA

## Por que as notícias sumiam?

O SQLite fica no **disco temporário** do Render. Em todo redeploy o arquivo some.  
**Solução: usar PostgreSQL do Render** (persistente).

## Language
**Node**

## Comandos

| Campo | Valor |
|--------|--------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

## 1) Criar banco PostgreSQL

1. No Render: **New → PostgreSQL**  
2. Nome: `linhadireita-db`  
3. Depois de criado, copie **Internal Database URL**

## 2) Variáveis do Web Service

```
NODE_VERSION=20
DATABASE_URL=<Internal Database URL do Postgres>
XAI_API_KEY=sua_chave_xai
GROK_MODEL=grok-4.5
GROK_IMAGE_MODEL=grok-imagine-image
ADMIN_USER=admin
ADMIN_PASSWORD=84074070
ADMIN_SESSION_SECRET=texto-longo-aleatorio
CRON_SECRET=outro-segredo
NEXT_PUBLIC_SITE_URL=https://SEU-APP.onrender.com
MAX_REWRITE_PER_CYCLE=2
MAX_ARTICLES=200
```

Se o Web Service e o Postgres estiverem no **mesmo blueprint**, use:

- `DATABASE_URL` → **From Database** → connection string

## 3) Coleta

| Origem | Limite |
|--------|--------|
| **Cron automático** | 2 notícias por hora |
| **Admin → Coletar agora** | Sem limite horário (até 50 por clique) |

Cron (1x por hora):

```
POST https://SEU-APP.onrender.com/api/cron/collect?secret=SEU_CRON_SECRET
```

Schedule: `0 * * * *`

## Admin
`/admin` — user `admin` / senha configurada
