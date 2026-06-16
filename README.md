# ¿Qué Dice Perú?

Plataforma de mercados de predicción peruana. MVP funcional con usuarios, wallet
de DICE Coins, mercados de predicción, ranking, badges y panel de administrador.

> Sin dinero real. Todo se mide en **DICE Coins** (saldo virtual inicial: 10,000).

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Prisma** + SQLite (cambiable a PostgreSQL con una línea)
- **NextAuth** (Google + cuenta de prueba sin contraseña)

## Cómo correrlo

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia el archivo de variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Genera un `NEXTAUTH_SECRET` con `openssl rand -base64 32` y pégalo en `.env`.

3. Crea la base de datos y siembra datos iniciales (mercados, badges, usuario demo):

   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. Corre el proyecto:

   ```bash
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000)

## Cuentas de prueba

En la pantalla de login, usa la opción **"cuenta de prueba"** y entra con cualquier
email — se crea la cuenta automáticamente con 10,000 DICE Coins.

El seed crea un usuario administrador:

- Email: `ale@quedicePeru.pe`
- Usa ese mismo email en la cuenta de prueba para entrar como **admin** y acceder
  a `/admin` (crear mercados y resolver resultados).

## Activar login con Google

1. Crea credenciales OAuth en [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Agrega `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` a `.env`

## Cambiar a PostgreSQL

1. En `prisma/schema.prisma`, cambia:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. En `.env`, pon tu connection string de Postgres (Supabase, Neon, RDS, etc.)
3. Corre `npx prisma db push` de nuevo

## Estructura del proyecto

```
prisma/
  schema.prisma     # modelos: User, Market, Position, Badge, UserBadge
  seed.ts           # datos iniciales

src/
  app/
    page.tsx         # Home: hero + mercados
    ranking/         # Ranking nacional
    perfil/          # Perfil de usuario, predicciones, badges
    admin/           # Panel admin (crear/resolver mercados)
    login/           # Login (Google + cuenta de prueba)
    api/
      markets/       # GET listar mercados
      positions/     # POST comprar posición
      ranking/       # GET ranking por precisión
      profile/       # GET perfil del usuario logueado
      admin/markets/ # CRUD de mercados (solo admins)
  components/        # MarketCard, BuyModal, Navbar, Hero, etc.
  lib/
    prisma.ts        # cliente Prisma
    auth.ts          # configuración NextAuth
    types.ts         # tipos compartidos
```

## Cómo funciona el mercado

- Cada mercado tiene una probabilidad de "SÍ" (1-99%).
- El precio de comprar SÍ = probabilidad/100, y NO = (100-probabilidad)/100.
- Al comprar, la probabilidad se ajusta levemente hacia la dirección comprada
  (simulando oferta/demanda — esto es una simplificación; para un mercado real
  se recomienda implementar un market maker tipo LMSR).
- Cuando un admin resuelve un mercado, los usuarios que apostaron correctamente
  reciben `monto / precio` DICE Coins de vuelta.

## Próximos pasos sugeridos

- Asignación automática de badges según resultados (actualmente se asignan
  manualmente en el seed / vía Prisma Studio)
- Comentarios y análisis de la comunidad por mercado
- Notificaciones cuando un mercado que sigues está por cerrar
- Versión con dinero real (requiere licencias y cumplimiento regulatorio en Perú)
- App móvil con React Native reutilizando esta misma lógica de API
