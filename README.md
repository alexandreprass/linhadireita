# LINHA DIREITA

Portal de notícias moderno (Next.js + Tailwind + Prisma) com:

- Coleta periódica via **RSS** (Jovem Pan, Revista Oeste, Gazeta do Povo, CNN Brasil, Metrópoles)
- **Filtro** de pautas sobre Lula / PT / aliados
- **Reescrita** original com **Grok** (xAI)
- **Imagens** com **Grok Imagine**
- Publicação automática + **destaque** na home
- **Admin** com login, postagem manual, apagar e coletar
- SEO básico (title, description, Open Graph)

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS 4 |
| Banco | SQLite (local) / PostgreSQL (Render) |
| IA | Grok texto + Grok Imagine (`api.x.ai`) |
| Worker | `POST /api/cron/collect` (Render Cron a cada 30 min) |

## Setup local

```bash
npm install
cp .env.example .env
# edite .env e coloque XAI_API_KEY
npx prisma db push
npm run dev
```

Abra:

- Site: http://localhost:3000  
- Admin: http://localhost:3000/admin  
- Login: `admin` / `84074070` (ou o que estiver em `ADMIN_PASSWORD`)

### Variáveis importantes

```env
DATABASE_URL="file:./dev.db"
XAI_API_KEY=xai-...
GROK_MODEL=grok-4.5
GROK_IMAGE_MODEL=grok-imagine-image
ADMIN_USER=admin
ADMIN_PASSWORD=84074070
CRON_SECRET=segredo-do-cron
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Fluxo do sistema

```
RSS → filtra Lula/PT → Grok reescreve (tom pro-Bolsonaro se aplicável)
    → Grok Imagine gera imagem → salva no banco (featured) → aparece no site
```

Disparo manual no admin: **Coletar agora**  
Ou: `POST /api/cron/collect?secret=CRON_SECRET`

## Admin

| Recurso | Rota |
|---------|------|
| Login | `/admin/login` |
| Lista / apagar / destacar | `/admin` |
| Publicar manual | `/admin/nova` |
| Coleta | botão no painel ou API |

## Deploy no Render

1. Push deste repositório no GitHub  
2. New → Blueprint → `render.yaml` **ou** Web Service Node  
3. Configure `XAI_API_KEY`, `ADMIN_PASSWORD`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`  
4. Banco: **PostgreSQL** (recomendado no Render)

### PostgreSQL no Render

No `prisma/schema.prisma`, troque:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Depois: `npx prisma db push`

### Cron (a cada 30 min)

Configure um Cron Job no Render apontando para:

```
POST https://SEU-APP.onrender.com/api/cron/collect?secret=SEU_CRON_SECRET
```

## Estrutura

```
src/
  app/                 # páginas + API routes
  components/          # UI
  lib/
    collector.ts       # pipeline RSS + publish
    grok.ts            # texto + imagem
    filter.ts          # regras editoriais
    auth.ts            # sessão admin
    sources.ts         # feeds
prisma/schema.prisma
```

## Regras editoriais

1. **Nunca** publicar sobre Lula, PT ou aliados  
2. Se envolver **Bolsonaro / Flávio Bolsonaro** → tom favorável  
3. Texto jornalístico, claro, natural, em português BR  

## Licença

Uso privado do projeto.
