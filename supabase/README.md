# Esquema Supabase

La migración inicial crea los perfiles, roles, eventos, inscripciones, álbumes y fotos. La web podrá leer eventos publicados y álbumes publicados; solo las cuentas registradas como administradoras pueden crear o modificar contenido.

## Asignar el primer administrador

Primero crea la cuenta con el flujo de registro de Supabase Auth. Después, desde el SQL Editor del proyecto, asigna el rol a su correo:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'correo-del-administrador@example.com'
on conflict (user_id, role) do nothing;
```

La tabla de roles no admite escrituras desde la API pública. El alta inicial y los cambios de administrador se hacen desde un entorno de confianza.

## Inscripciones

Las cuentas autenticadas consultan sus propias inscripciones. Para apuntarse o cancelar, el cliente debe llamar a `register_for_event(event_id)` o `cancel_my_event_registration(event_id)`. La función de inscripción bloquea el evento mientras comprueba el aforo y evita duplicados.

Aplica `20261002000000_close_completed_events.sql` para cerrar también la inscripción en la base de datos cuando haya pasado el día del evento en horario de Madrid. La web marca esas operaciones como completadas y muestra cinco por página, de más recientes a más antiguas.

Después de la migración inicial, aplica `20261001020000_event_registration_summary.sql`: `get_event_registration_count(event_id)` permite consultar el total de un evento publicado y `get_event_participants(event_id)` devuelve solo nombres visibles a usuarios autenticados. No expone correos.

La migración `20261001020000_event_registration_summary.sql` añade el contador de inscritos (`get_event_registration_count`) y la lista autenticada de nombres (`get_event_participants`). La lista solo devuelve nombres visibles, nunca correos.

## Aprobación de miembros

Aplica también `20261001030000_member_approval.sql`. Los perfiles existentes quedan aprobados para no interrumpir cuentas actuales; cada registro nuevo empieza pendiente. El panel de administración permite aprobarlo como miembro y, en una acción posterior separada, promoverlo a administrador. La promoción exige email confirmado. La aprobación de miembro habilita inscripciones y consulta de asistentes, pero Supabase seguirá exigiendo confirmar el correo para iniciar sesión.

Aplica después `20261001040000_separate_member_admin_role.sql` para mantener separadas ambas acciones: `approve_member_request(user_id)` solo aprueba la pertenencia y `set_user_admin_role(user_id)` asigna el rol admin únicamente a un miembro ya aprobado y con email confirmado. El panel muestra ambas operaciones en la misma pestaña, pero en bloques distintos. No se concede acceso de escritura directo a la tabla de roles desde el navegador.

En Supabase Auth > URL Configuration, configura `https://leg-ix.com` como Site URL y añade estos Redirect URLs: `https://leg-ix.com/**`, `https://www.leg-ix.com/**` y `http://localhost:3000/**`. El registro envía el enlace de confirmación de vuelta al mismo origen desde el que se registró el usuario. Para evitar límites del correo de prueba de Supabase al invitar a varios usuarios, configura un SMTP propio en Authentication > SMTP Settings.

## Fotos

El bucket privado `mission-photos` permite leer únicamente fotos de álbumes publicados; los administradores también pueden leer borradores. Solo administradores pueden subir, modificar o borrar. El frontend deberá solicitar URLs firmadas para mostrar fotos publicadas. La base de datos guarda rutas relativas, no URLs firmadas ni claves secretas.

## Aplicar las migraciones

Desde la raíz del repositorio, inicializa y enlaza la CLI con el proyecto y ejecuta `supabase db push`; las migraciones se aplican en orden. También puedes ejecutar los archivos SQL en el SQL Editor de Supabase, empezando por la migración inicial y siguiendo por las migraciones de resumen de inscripciones, aprobación de miembros, separación del rol admin y cierre de operaciones completadas. No se añaden claves privilegiadas al repositorio: el frontend solo usa la URL y la clave pública.