# Porra Familia · Mundial 2026

## Setup en 5 pasos

### 1. Instalar Node.js
Descarga e instala desde https://nodejs.org (versión LTS)

### 2. Crear proyecto Supabase
1. Ve a https://supabase.com → New project
2. Guarda el nombre del proyecto, por ejemplo "porra-familia"
3. En el panel: Settings → API → copia "Project URL" y "anon public key"

### 3. Crear las tablas
1. En Supabase: SQL Editor → New query
2. Copia y pega el contenido de `supabase-setup.sql`
3. Run

### 4. Configurar credenciales
```bash
cp .env.example .env
```
Edita `.env` con tus valores reales de Supabase.

### 5. Instalar, probar y publicar
```bash
npm install
npm run dev          # prueba local en http://localhost:5173
npm run deploy       # publica en GitHub Pages
```

## GitHub Pages
1. Crea repo en GitHub llamado `porra-familia`
2. En vite.config.js, cambia `base: '/porra-familia/'` por el nombre exacto de tu repo
3. `npm run deploy`
4. En GitHub: Settings → Pages → Branch: gh-pages
5. URL: https://tuusuario.github.io/porra-familia/

## Admin
Contraseña por defecto: `admin2026`
Cámbiala en `src/data.js` antes de publicar.
