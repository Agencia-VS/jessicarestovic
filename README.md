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
| **TypeScript 6.0.3** | Tipos en todo, incluido el esquema de la base |
| **Tailwind CSS 4** | Sistema de diseño en tokens (`src/app/globals.css`) |
| **Supabase** | Postgres, autenticación del panel y almacenamiento de imágenes |
| **Vercel** | Hosting, CDN y despliegue automático |

## Diseño

El del canvas de Claude Design: fondo crudo, grafito y **un solo acento
ciruela**, reservado para enlaces y estados activos — nunca compitiendo con el
color real de las obras. Menos interfaz visible, tipografía silenciosa y la
obra siempre protagonista.

Las obras **nunca se recortan**: cada pieza conserva su proporción real, y es
la foto la que dicta el alto de su tarjeta. En la retícula hay un tope suave
(nada más alto que ~2:1 ni más ancho que 3.2:1) para que una pieza alargada no
se coma una columna entera; en la vista ampliada la proporción es exacta. La
retícula son columnas CSS, no una grilla de cuadrados: las alturas son
distintas a propósito.

Tipografías: *Public Sans* (texto de apoyo, navegación, pies de obra) y
*Newsreader* (títulos, nombres de obra y párrafos de presentación). El
logotipo es la firma manuscrita de Jessica, en AVIF con un PNG transparente de
respaldo (`public/firma-jessica.*`).

Los tokens de color, las tipografías y las utilidades (`marco`, `gutter`,
`eyebrow`, `etiqueta`, `pie`, `ficha`, `mosaico`, `aparece`) viven en
`src/app/globals.css`.

### Mapa de páginas

No hay índice general de obra: la trayectoria es la puerta al cuerpo de obra.
Se entra a una serie desde la exposición que la mostró, y la página de serie
vuelve a esa exposición.

| Página | Qué muestra |
| --- | --- |
| `/` | Una imagen de portada y una sola línea de texto |
| `/exposiciones` | Índice de muestras: una portada por exposición, con su total de imágenes |
| `/exposiciones/[slug]` | Una muestra: ficha, texto y todas sus vistas de montaje |
| `/serie/[slug]` | Una serie: descripción, ficha, sus piezas y navegación entre series |
| `/trabajos-recientes` | Lo último cargado, sin importar la serie |
| `/sobre-mi` · `/clases` · `/contacto` | Biografía, talleres y contacto |
| `/privacidad` | Qué datos recogen los formularios y para qué |

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

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Sin el prefijo `NEXT_PUBLIC_`: nada del navegador las necesita, así que no se
exponen. Ver «Variables privadas» más abajo.

### 2. Aplicar las migraciones

**La forma más rápida:** abrir el **SQL Editor** del panel de Supabase y pegar
`supabase/puesta-en-marcha.sql` completo. Junta las seis migraciones en orden
y se puede volver a correr sin duplicar contenido ni fallar.

Ese archivo se genera desde las migraciones, así que no se edita a mano:

```bash
npm run sql     # regenera supabase/puesta-en-marcha.sql
```

Con el [CLI de Supabase](https://supabase.com/docs/guides/cli), la alternativa
es aplicar las migraciones una por una:

```bash
supabase link --project-ref <ref-del-proyecto>
supabase db push
```

| Archivo | Qué hace |
| --- | --- |
| `0001_schema.sql` | Tablas: series, obras, exposiciones, mensajes y páginas editables |
| `0002_rls_storage.sql` | Políticas de acceso y el bucket `obras` para las imágenes |
| `0003_contenido_inicial.sql` | Las 7 series y 7 exposiciones reales del sitio actual |
| `0004_configuracion.sql` | Datos de contacto y frase de portada, editables desde el panel |
| `0005_exposicion_serie.sql` | Medidas de las fotos de sala y técnicas de Clases con descripción |
| `0006_exposicion_series.sql` | Una muestra puede exponer varias series (ver abajo) |

Verificadas contra un Postgres 16 real: las seis aplican en orden desde una base
vacía, y el archivo consolidado corre tres veces seguidas sin error ni
duplicados.

### Una muestra expone varias series

`0006` reemplaza la columna `exposicion.serie_id` por la tabla
`exposicion_serie`. El motivo es concreto: **«Ensambles al Cubo» expuso también
«Espacios Íntimos»**, y con una sola columna ese dato no cabía —el lugar lo
ocupaba la serie homónima—, así que «Espacios Íntimos» quedaba sin ninguna
exposición que la mostrara. Como el sitio entra al cuerpo de obra por la
trayectoria, una serie sin exposición no se alcanza.

La relación es de muchos a muchos en los dos sentidos: una muestra puede reunir
varias series, y una serie puede volver a exponerse años después. En el panel se
marca con casillas, en la ficha de cada exposición.

### 3. Crear el acceso de Jessica

No hay registro público: la cuenta se crea a mano. En el panel de Supabase,
**Authentication → Users → Add user**, con correo y contraseña. Conviene crear
también una cuenta de soporte.

Después se entra en `/admin`.

### 4. Desplegar en Vercel

Importar el repositorio en Vercel y cargar las tres variables de entorno
(`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SITE_URL`). Cada push a la rama
principal despliega solo.

## Estructura

```
src/
├── app/
│   ├── page.tsx              Inicio — la imagen de portada
│   ├── exposiciones/         Índice de muestras y la página de cada una
│   ├── serie/[slug]/         Una serie con sus piezas y vista ampliada
│   ├── trabajos-recientes/   Lo último cargado
│   ├── sobre-mi/             Biografía y retrato
│   ├── clases/               Talleres y formulario de interés
│   ├── contacto/             Correo, WhatsApp, Instagram y formulario
│   ├── privacidad/           Qué datos se recogen y para qué
│   └── admin/
│       ├── login/            Acceso (fuera del marco del panel)
│       └── (panel)/          Obras, Series, Exposiciones, Sobre mí, Clases,
│                              Mensajes y Configuración
├── components/
│   ├── site/                 Componentes del sitio público
│   ├── admin/                Componentes del panel
│   └── ui/                   Primitivas compartidas (campos, botones, estados)
├── lib/
│   ├── acciones/             Server Actions (una por entidad)
│   ├── data/                 Consultas, tipos de dominio y contenido de demo
│   ├── supabase/             Clientes (navegador, servidor, sesión)
│   ├── images.ts             Especificación de imágenes y validación
│   ├── site-config.ts        Identidad, navegación y datos de contacto
│   └── validacion.ts         Esquemas de Zod
├── types/database.ts         Tipos del esquema de Postgres
└── proxy.ts                  Refresca la sesión y protege /admin
```

### Variables privadas

Ninguna variable lleva el prefijo `NEXT_PUBLIC_`, así que ninguna llega al
navegador. No es solo cosmético:

- **La clave `anon`** Supabase la publica a propósito y toda la protección real
  vive en las políticas de RLS. Pero acá el navegador no la usa nunca: el panel
  entra por Server Actions y las páginas se renderizan en el servidor. Si no la
  necesita, no se expone.
- **La URL de Supabase** la necesitaban tres componentes de cliente del panel
  para armar el `src` de las miniaturas. Ahora la resuelve la capa de datos y
  viaja como dato (`obra.imagenUrl`, `foto.imagenUrl`), no como configuración.
  `urlImagen()` vive en `src/lib/imagenes-servidor.ts`, separado de `images.ts`
  justamente porque ese sí lo importan componentes de cliente para validar
  archivos antes de subirlos.

Comprobado, no supuesto: con las variables cargadas, se descargó el bundle que
el navegador recibe en `/admin/login` y no aparece ni el host de Supabase ni la
clave. La comprobación busca esos valores concretos —no el nombre de la
variable— y verifica además que una cadena de control del formulario de cliente
sí aparezca; así confirma que se estaba mirando el bundle correcto.

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
- **TypeScript 6.0.3, no 7.** Next.js 16.3.4 soporta TypeScript 7 sin
  problema: el proyecto compila con `7.0.2`, tanto en `tsc --noEmit` como en
  `next build`. El bloqueo está en el lint. `typescript-eslint@8.69.0` —la
  última publicada, y también su canary `8.69.1-alpha.0`— declara
  `"typescript": ">=4.8.4 <6.1.0"` y lanza un error duro con TS 7. Como
  `eslint-config-next` la carga al inicializar, con TS 7 no corre ninguna
  configuración de lint, ni siquiera `core-web-vitals` por separado. Anidar
  TS 6 solo para el linter tampoco sirve: el fallo se muda a `ts-api-utils`,
  que resuelve TypeScript desde la raíz. Así que 6.0.3 es el techo real del
  ecosistema hoy, no una versión elegida por comodidad. Para subir a 7 cuando
  `typescript-eslint` publique soporte basta cambiar la versión en
  `package.json`.
- **ESLint 9.39.5, no 10.** El `eslint-plugin-react` que trae
  `eslint-config-next` 16 usa la API antigua de contexto y falla con ESLint 10.

## Vista de diseño sin base de datos

Mientras Supabase no esté configurado, el sitio público no se muestra vacío:
responde con el contenido de referencia de `src/lib/data/demo.ts`, que replica
el canvas —las mismas series, proporciones y tonos— para poder revisar el
diseño antes de que exista una sola foto. Las imágenes de `public/demo/` son
bloques de color, no obra de la artista, y el pie lo dice explícitamente.

En cuanto se configuran las variables de Supabase, las consultas dejan de mirar
ahí y el contenido real toma su lugar. No hay forma de que ambos convivan.

El panel, en cambio, sí se muestra vacío: no tendría sentido editar obras que
no existen.

## Contenido

Las 7 series y 7 exposiciones se siembran con los datos reales del sitio
actual, ya normalizados: «Ensambles al Cubo» existe **una sola vez** como serie
y la exposición homónima la referencia, que era la duplicación del sitio en Wix.

Falta cargar desde el panel:

- Las fotos de las obras y de las exposiciones.
- La biografía de «Sobre mí» y el retrato (el texto de `/about` sirve casi tal
  cual).
- Revisar el texto de «Clases».
- Marcar una obra como **destacada**: es la que hace de portada del Inicio.
- Los **años** de las muestras. Hoy solo «Volúmenes» (2013) tiene fecha; el
  resto aparece con «—» y el listado no puede ordenarse cronológicamente de
  verdad hasta tenerlos.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
```

## Contacto de Jessica

Los datos de contacto y la frase de portada se editan desde **Configuración**
en el panel: correo, teléfono, Instagram y cita. Jessica completa un campo por
cosa —nunca una URL—, y el sitio deriva el enlace de WhatsApp de los dígitos
del teléfono y el de Instagram del usuario.

`src/lib/site-config.ts` guarda los valores por defecto
(`jessicarestoviclucic@gmail.com`, `+56 9 8747 2258`,
[@jessica_restovic](https://www.instagram.com/jessica_restovic/)), que se usan
mientras no haya base de datos conectada.
