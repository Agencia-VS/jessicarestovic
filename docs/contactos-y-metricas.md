# Grillas, contacto y estadísticas

## Qué incluye

- Portadas cuadradas y orden por filas en Exposiciones y Trabajos; 3/2/1 columnas según pantalla.
- Orden completo guardado en una transacción. Una lista incompleta o de otro tipo falla sin cambios.
- Ajuste horizontal y vertical del recorte de la portada. Galerías y originales conservados.
- Consulta guiada por WhatsApp con motivo y grupo de interés. El usuario pulsa Enviar dentro de WhatsApp.
- Registro opcional de contactos y autorización separada para novedades por correo.
- Preferencia de analítica con aceptar/rechazar/configurar y revocación desde el pie.
- Contactos con estado, historial de autorizaciones, baja, eliminación y exportación CSV.
- Estadísticas por fecha de Chile, período anterior, procedencia, dispositivo y páginas.
- Archivo de mensajes antiguos conservado; se cierra su entrada pública.

## Activación de una instalación existente

1. Respaldar la base y aplicar únicamente 0007_grilla_orden.sql y 0008_contactos_metricas.sql en orden. No ejecutar reinicio.sql. Para una base nueva usar puesta-en-marcha.sql.
2. Agregar SUPABASE_SERVICE_ROLE_KEY en el servidor de producción. Nunca usar NEXT_PUBLIC_.
3. Generar CRON_SECRET aleatorio de al menos 32 bytes y configurarlo en Vercel. vercel.json ejecuta /api/mantenimiento diariamente a las 06:15 UTC. Comprobar una ejecución autenticada antes de activar la captación.
4. Habilitar explícitamente a Jessica y, si corresponde, una cuenta de soporte:
   ```sql
   insert into public.admin_comercial(user_id)
   select id from auth.users where email = 'CORREO_REAL_DE_LA_CUENTA'
   on conflict do nothing;
   ```
   Comprobar que el SELECT encontró exactamente la cuenta esperada. Una cuenta autenticada sin esta habilitación no puede consultar contactos ni estadísticas.
5. Confirmar el teléfono de Jessica en Configuración y SITE_URL con el dominio canónico real. Se conserva el teléfono configurado; el respaldo existente es +56 9 8747 2258.
6. Revisar la política pública con Jessica: identidad responsable, canal de derechos, plazos de retención, proveedores y transferencias. Comprobar las regiones y contratos reales de Vercel/Supabase y establecer la atención de solicitudes y el manejo de incidentes.
7. Desplegar la rama solo después de revisar el PR y aprobar las comprobaciones.

Sin clave privada no se habilitan registro ni medición. Las previews y desarrollo los desactivan por defecto; ENABLE_ANALYTICS_TEST=true debe usarse solo con una base separada de pruebas. No dirigir pruebas automatizadas a datos reales.

## Qué significa cada métrica

Una visita es una sesión aleatoria, renovada con cada evento y con 30 minutos de inactividad como límite. No es una persona identificada ni un visitante único entre dispositivos. La tasa es sesiones con al menos una acción de contacto / sesiones medidas. Se deduplica por sesión aunque haya varios clics. Los contactos registrados se cuentan aunque rechacen analítica. Clics en WhatsApp, Instagram o correo indican intención, no un envío confirmado ni una venta.

La medición se realiza solo con consentimiento vigente. Excluye cuentas autenticadas, rutas privadas y previews. No se guardan IP, texto del mensaje, parámetros de URL ni referencias completas en los eventos. Los parámetros de procedencia se reducen a categorías permitidas. Los períodos anteriores pueden estar incompletos si preceden a la activación o al límite de retención.

El panel agrega en SQL para no truncarse a las primeras 1000 filas de PostgREST. Exportación paginada y protegida, con neutralización de fórmulas en CSV.

## Consentimiento y retención

Analítica y novedades son finalidades separadas. No hay casillas premarcadas. El rechazo no impide consultar obras ni contactar por WhatsApp. Una retirada invalida en servidor el consentimiento analítico anterior y bloquea de inmediato el cliente. Los fallos al guardar la preferencia mantienen la medición desactivada.

Cookie de preferencia: 180 días, firmada, HttpOnly, SameSite=Lax y Secure en producción. Sesión: 30 minutos. Eventos y preferencias: 180 días. Contactos: 12 meses desde última gestión. El cron elimina los registros vencidos; los consentimientos de contacto se eliminan en cascada. Los límites de abuso usan un identificador HMAC diario y se depuran. Monitorizar el cron: sin ejecución, los datos vencidos permanecen en la base.

La baja por enlace usa un secreto en el fragmento de URL, que el navegador no envía al servidor durante la navegación. La acción requiere una confirmación explícita y detiene novedades para los registros del mismo correo. El panel también permite retirar la autorización. La eliminación completa se gestiona por el canal de privacidad y desde el panel. Revisar y depurar por separado el archivo de mensajes anterior y las copias de seguridad de los proveedores.

No se conectan campañas automáticas. Antes de añadir un proveedor de correo se requiere verificación de correo, lista de supresión, baja en cada mensaje, contratos y pruebas de entrega. Un contacto guardado no autoriza publicidad si novedades=false.

## Marco normativo

Consultado el 20 de octubre de 2026: la ficha oficial de la Ley 21.719 señala vigencia desde el 1 de diciembre de 2026:
https://www.bcn.cl/leychile/Navegar?idNorma=1209272&idVersion=2026-12-01

Esta implementación prepara controles técnicos; no acredita por sí sola cumplimiento integral. La revisión de identidad, base jurídica por finalidad, transferencias, contratos, atención de derechos y retención del archivo anterior corresponde a la puesta en producción.

## Comprobaciones antes de publicar

- npm ci; npm run typecheck; npm run lint; npm run build.
- node --experimental-strip-types --test tests/estadisticas.test.mjs.
- Pruebas SQL en una base vacía de pruebas: psql -v ON_ERROR_STOP=1 -f tests/comercial.sql.
- Revisar grillas en móvil/tablet/escritorio y reordenar ocultos/publicados.
- Guardar recorte, volver a abrir y comprobar la portada y el original.
- Rechazar: sin eventos. Aceptar: una visita. Retirar: ninguna medición posterior, incluso reutilizando una cookie anterior.
- Enviar consulta con y sin guardado; repetir un envío con el mismo identificador: un solo contacto y sus consentimientos.
- Verificar enlace de baja, retirada desde admin y eliminación.
- Probar sin sesión y con cuenta no habilitada: sin datos ni CSV.
- Revisar el cron, conservación y que las claves privadas no aparezcan en el navegador.

La copia inicial se comprobó localmente; esta rama se reconstruyó a través de GitHub al perderse el entorno de ejecución. Las comprobaciones sobre el commit de este PR deben quedar registradas en CI. No confundir una prueba anterior con la validación del commit actual.
