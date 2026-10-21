# Revisión del PR 31 — 21 de octubre de 2026

Se revisó el diff completo del PR 31, los flujos de sus 44 archivos y las dependencias de autenticación, consultas y políticas. La corrección continúa en el PR 32, que también retira los enlaces de consulta no solicitados. No se ejecutaron escrituras ni migraciones en producción.

## Hallazgos

| Prioridad | Hallazgo y efecto | Evidencia y corrección |
| --- | --- | --- |
| P1 | El orden pasó a depender de `reordenar_grupos`, pero publicar el código no aplica 0007 en Supabase. En una base sin actualizar, arrastrar y las flechas fallan siempre; el aviso anterior sugería recargar. | `src/lib/acciones/exposiciones.ts`, `supabase/migrations/0007_grilla_orden.sql`. Se distinguen PGRST202/42883 y se muestra la actualización concreta pendiente. La función SQL sigue siendo necesaria: no se sustituye por varias escrituras parcialmente aplicables. |
| P1 | Crear o editar un grupo enviaba siempre las nuevas columnas de encuadre, incluso cuando el formulario no las ofrecía. Esto rompía las ediciones normales si 0007 no estaba aplicada. | `leerCampos` enviaba `portada_foco_x/y` incondicionalmente. Ahora solo se envían si el formulario tiene encuadre; el editor detecta si las columnas existen. Reproducido contra el commit original con `tests/acciones.test.mjs`. |
| P2 | La lista conservaba una copia de las exposiciones y solo la renovaba al cambiar la secuencia de IDs. Publicar/ocultar podía guardarse, pero la pantalla seguía mostrando el estado anterior y el siguiente clic repetía la operación. | `src/components/admin/lista-exposiciones.tsx`. Defecto previo que el PR conservó y que la validación omitió. Se reemplazó por `useOptimistic`: las propiedades actuales del servidor son la base y solo el orden es optimista durante la acción. |
| P2 | El arrastre dependía exclusivamente de HTML Drag and Drop; no gestionaba el gesto táctil. La miniatura añadida conservaba además su arrastre nativo. | La interacción usa ahora un control ↕ con Pointer Events para ratón y táctil, captura del puntero, cancelación y un umbral que distingue clic de arrastre. Las miniaturas no son arrastrables. Se mantienen las flechas como alternativa de teclado. |
| P2 | El cambio de publicación ignoraba errores de Supabase. Además, se podía iniciar una eliminación durante el guardado del orden. | La acción devuelve un resultado comprobado y la lista muestra el fallo. La eliminación se deshabilita mientras hay una escritura pendiente. |
| P2 | Se añadieron enlaces «Consultar por esta exposición/trabajo» sin solicitud del cliente. | Eliminados en el primer commit del PR 32. |

Los defectos de actualización visual y de propagación del error de publicación ya existían antes del PR 31. La dependencia nueva de migración y el envío incondicional del encuadre sí se introdujeron en ese PR. La revisión distingue ambas situaciones; las dos debían haberse comprobado antes de presentar el flujo como terminado.

## Obras dentro de exposiciones y tipografía

Las fotos de sala siguen siendo un flujo separado. La ficha de administración de cada exposición ahora incluye sus obras, con acceso a la carga individual o por carpeta y el campo obligatorio «Título» que ya comparten las obras de Trabajos. La página pública muestra ambas colecciones por separado; al ampliar una obra, su título se ve en la misma galería.

La auditoría tipográfica confirmó que la familia del sitio ya era una sola —Public Sans, también en `font-display`— y que los tamaños de apoyo tenían niveles semánticos. La excepción era el título de obra en el visor: 22–32 px, itálico, frente a las cartelas de grupo de 22–28 px y los nombres de tarjetas de 17 px. El nombre de obra queda en 16–18 px, normal y con el mismo `font-sans` del cuerpo, y se retira la descarga de la variante itálica. La prueba de navegador comprueba familia, estilo y tamaño en escritorio y móvil.

## Pruebas

- `npm test`: fechas, CSV, encuadre, compatibilidad del formulario y errores de las acciones del servidor.
- `TEST_PR31_BASELINE=true node --test tests/acciones.test.mjs`: comparación opcional con el commit original. Reproduce tres fallos y un caso correcto; su salida fallida es deliberada y no se ejecuta como control de CI.
- `npm run test:http`, después del build: consentimiento, cookies firmadas, rechazo de origen externo, revocación de cookies antiguas, validación, registros idempotentes y acceso al cron.
- `npm run test:funcional`, después del build y de `npx playwright install chromium`: aplicación Next real en Chromium, con transporte Supabase simulado y datos aislados. Prueba ratón/táctil y cancelación, flechas, orden al recargar, fallos de guardado, publicación, encuadre, carga/nombre de obras en exposiciones, tipografía móvil/escritorio, contacto con/sin registro, baja, preferencias, permisos del panel, CSV y grillas 3/2/1. La navegación a WhatsApp se intercepta: no se envían mensajes.
- `tests/comercial.sql`: funciones y políticas reales en PostgreSQL, incluidas ordenación atómica, listas incompletas/duplicadas, autorizaciones, retención y agregación de más de 1000 eventos. Sigue ejecutándose en GitHub Actions.

Las pruebas de navegador ejercitan la interfaz y las Server Actions reales. El transporte Supabase del navegador es simulado; las pruebas SQL verifican la base por separado. Esto no certifica que la base ni las variables de producción estén configuradas. El CI guarda trazas cuando falla una prueba funcional.

Verificación local: 8 pruebas unitarias/de acciones y 10 escenarios de navegador aprobados, suite HTTP aprobada, `typecheck`, `lint`, build y consistencia del SQL consolidado aprobados. El script SQL pasó localmente en PGlite; GitHub Actions lo ejecuta contra PostgreSQL 16. La comparación con el commit original produjo los tres fallos esperados.

## Comprobación pendiente en la base desplegada

No se dispone aquí de una conexión a la base de producción. Para comprobar su estado sin modificar datos:

```sql
select
  to_regprocedure('public.reordenar_grupos(uuid[],text)') is not null as orden_disponible,
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='exposicion'
      and column_name='portada_foco_x') as encuadre_disponible;
```

Si devuelve `false`, aplicar `supabase/migrations/0007_grilla_orden.sql` en el proyecto correcto. No ejecutar `reinicio.sql`. Los módulos comerciales requieren además 0008, las variables y la habilitación de la cuenta descritas en `docs/contactos-y-metricas.md`.
