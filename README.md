# jessicarestovic.com

Sitio y panel de administración de **Jessica Restović**, artista visual.

Reemplaza el sitio en Wix por uno propio: pago único de desarrollo,
infraestructura de costo casi nulo y un panel donde Jessica publica su obra sin
depender de nadie.

## Stack

| Pieza | Qué hace |
| --- | --- |
| **Next.js 16** (App Router, Turbopack) | Sitio público y panel, con optimización de imágenes incorporada |
| **React 19** | Interactividad: galería, formularios, carga de fotos |
| **TypeScript 6** | Tipos en todo, incluido el esquema de la base |
| **Tailwind CSS 4** | Sistema de diseño en tokens (`src/app/globals.css`) |
| **Supabase** | Postgres, autenticación del panel y almacenamiento de imágenes |
| **Vercel** | Hosting, CDN y despliegue automático |

## Diseño

Dirección **A — «Sala blanca»**, tomando de la dirección B la estructura por
series: fondo hueso, una obra a la vez, tipografía casi invisible y la firma
manuscrita como logotipo. Las obras **nunca se recortan** — cada pieza conserva
su proporción real, tanto en la retícula como en la vista ampliada.

Tipografías: *Schibsted Grotesk* (texto), *Instrument Serif* (nombres de serie)
e *Italianno* (la firma).

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar con los datos del proyecto de Supabase
npm run dev
```

El sitio funciona sin Supabase configurado: las páginas muestran estados vacíos
en vez de fallar, así se puede revisar el diseño antes de crear el proyecto.

### 1. Crear el proyecto de Supabase

En [supabase.com](https://supabase.com) crear un proyecto y copiar de
**Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Aplicar las migraciones

Los archivos de `supabase/migrations/` se aplican en orden. Con el
[CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <ref-del-proyecto>
supabase db push
```

O pegando cada archivo en el **SQL Editor** del panel de Supabase, en orden:

| Archivo | Qué hace |
| --- | --- |
| `0001_schema.sql` | Tablas: series, obras, exposiciones, mensajes y páginas editables |
| `0002_rls_storage.sql` | Políticas de acceso y el bucket `obras` para las imágenes |
| `0003_contenido_inicial.sql` | Las 7 series y 7 exposiciones reales del sitio actual |

### 3. Crear el acceso de Jessica

No hay registro público: la cuenta se crea a mano. En el panel de Supabase,
**Authentication → Users → Add user**, con correo y contraseña. Conviene crear
también una cuenta de soporte.

Después se entra en `/admin`.

### 4. Desplegar en Vercel

Importar el repositorio en Vercel y cargar las tres variables de entorno
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
`NEXT_PUBLIC_SITE_URL`). Cada push a la rama principal despliega solo.

## Estructura

```
src/
├── app/
│   ├── page.tsx              Inicio — obra destacada
│   ├── obra/                 Galería por serie, con vista ampliada
│   ├── exposiciones/         Listado cronológico, expandible con fotos
│   ├── sobre-mi/             Biografía y retrato
│   ├── clases/               Talleres y formulario de interés
│   ├── contacto/             WhatsApp, correo, Instagram y formulario
│   └── admin/
│       ├── login/            Acceso (fuera del marco del panel)
│       └── (panel)/          Obras, Series, Exposiciones, Sobre mí, Clases, Mensajes
├── components/
│   ├── site/                 Componentes del sitio público
│   ├── admin/                Componentes del panel
│   └── ui/                   Primitivas compartidas (campos, botones, estados)
├── lib/
│   ├── acciones/             Server Actions (una por entidad)
│   ├── data/                 Consultas y tipos de dominio
│   ├── supabase/             Clientes (navegador, servidor, sesión)
│   ├── images.ts             Especificación de imágenes y validación
│   ├── site-config.ts        Identidad, navegación y datos de contacto
│   └── validacion.ts         Esquemas de Zod
├── types/database.ts         Tipos del esquema de Postgres
└── proxy.ts                  Refresca la sesión y protege /admin
```

### Notas de implementación

- **`src/types/database.ts` usa `type`, no `interface`.** No es estilo:
  `postgrest-js` exige que cada tabla cumpla `Record<string, unknown>`, y
  TypeScript solo infiere firma de índice implícita para alias de tipo. Con
  interfaces, el esquema se resuelve a `never` y `.from()` deja de tipar.
- **`src/lib/acciones/resultado.ts` está separado de `comun.ts`** porque los
  formularios son componentes de cliente: si el tipo del resultado viviera
  junto a los ayudantes de servidor, `next/headers` terminaría en el bundle
  del navegador.
- **El panel es `force-dynamic`**: nunca se cachea.
- **TypeScript 6, no 7.** TypeScript 7.0 ya está publicado y el proyecto
  compila con él, pero `typescript-eslint` todavía no lo soporta, así que el
  lint se cae. Se puede subir en cuanto salga ese soporte.

## Contenido

Las 7 series y 7 exposiciones se siembran con los datos reales del sitio
actual, ya normalizados: «Ensambles al Cubo» existe **una sola vez** como serie
y la exposición homónima la referencia, que era la duplicación del sitio en Wix.

Falta cargar desde el panel:

- Las fotos de las obras y de las exposiciones.
- La biografía de «Sobre mí» y el retrato (el texto de `/about` sirve casi tal
  cual).
- Revisar el texto de «Clases».

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
```

## Contacto de Jessica

Los datos viven en `src/lib/site-config.ts`, en un solo lugar:
correo `jessicarestoviclucic@gmail.com`, WhatsApp `+56 9 8747 2258` e Instagram
[@jessica_restovic](https://www.instagram.com/jessica_restovic/).
