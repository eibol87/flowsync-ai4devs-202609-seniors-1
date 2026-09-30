## Purpose

Permite crear una cuenta de usuario, iniciar y cerrar sesión mediante tokens de acceso y consultar el perfil propio, tanto por API como desde las pantallas de la aplicación web. La API vive bajo `/api/v1` y responde siempre JSON.

## Requirements

### Requirement: Registro de cuenta

El sistema SHALL permitir crear una cuenta con `POST /api/v1/auth/signup` a partir de `fullName` (texto o `null`), `email`, `password` y `passwordConfirmation`, y SHALL devolver el usuario creado junto con un token de acceso, de modo que el usuario queda autenticado sin necesidad de hacer login.

#### Scenario: Registro correcto

- **WHEN** se envía `POST /api/v1/auth/signup` con un email válido no registrado, una contraseña de 8 a 32 caracteres y una `passwordConfirmation` idéntica
- **THEN** la respuesta es 200 con la forma `{ "data": { "user": {...}, "token": "<texto opaco>" } }`, donde el usuario incluye `id`, `fullName`, `email`, `createdAt`, `updatedAt` e `initials`, y nunca la contraseña

#### Scenario: Registro sin nombre

- **WHEN** se envía el registro con `fullName` igual a `null` y el resto de campos válidos
- **THEN** la cuenta se crea y `fullName` es `null` en la respuesta

### Requirement: Validación del registro

El sistema SHALL rechazar con 422 cualquier registro que incumpla las reglas de los campos, sin crear la cuenta ni emitir token, e informar de los errores por campo.

#### Scenario: Email ya registrado

- **WHEN** se envía el registro con un email que ya pertenece a otra cuenta
- **THEN** la respuesta es 422 con un error asociado al campo `email` y no se crea ninguna cuenta nueva

#### Scenario: Email inválido o demasiado largo

- **WHEN** se envía el registro con un `email` que no tiene formato de correo o supera 254 caracteres
- **THEN** la respuesta es 422 con un error asociado al campo `email`

#### Scenario: Contraseña fuera de rango

- **WHEN** se envía el registro con una `password` de menos de 8 o más de 32 caracteres
- **THEN** la respuesta es 422 con un error asociado al campo `password`

#### Scenario: Confirmación distinta

- **WHEN** se envía el registro con una `passwordConfirmation` que no coincide con `password`
- **THEN** la respuesta es 422 con un error asociado al campo `passwordConfirmation`

#### Scenario: Campos ausentes

- **WHEN** se envía el registro sin `email`, `password`, `passwordConfirmation` o `fullName`
- **THEN** la respuesta es 422 con un error por cada campo ausente (`fullName` es obligatorio aunque admita `null`)

### Requirement: Inicio de sesión

El sistema SHALL permitir iniciar sesión con `POST /api/v1/auth/login` mediante `email` y `password`, y SHALL devolver el usuario y un token de acceso nuevo.

#### Scenario: Credenciales correctas

- **WHEN** se envía el login con el email de una cuenta existente y su contraseña correcta
- **THEN** la respuesta es 200 con la forma `{ "data": { "user": {...}, "token": "<texto opaco>" } }`

#### Scenario: Varias sesiones simultáneas

- **WHEN** un usuario hace login dos veces y conserva ambos tokens
- **THEN** cada login devuelve un token distinto y ambos siguen siendo válidos hasta que se cierre su sesión

#### Scenario: Credenciales incorrectas

- **WHEN** se envía el login con un email inexistente o con una contraseña incorrecta para un email existente
- **THEN** la respuesta es 400 con un error de credenciales inválidas, sin distinguir cuál de los dos datos falló, y no se emite token

#### Scenario: Login mal formado

- **WHEN** se envía el login con un `email` sin formato de correo, o sin `email` o sin `password`
- **THEN** la respuesta es 422 con un error asociado al campo incorrecto, y no se comprueban credenciales

### Requirement: Consulta del perfil

El sistema SHALL devolver, con `GET /api/v1/account/profile`, los datos del usuario propietario del token presentado en la cabecera `Authorization: Bearer <token>`.

#### Scenario: Perfil con token válido

- **WHEN** se hace `GET /api/v1/account/profile` con un token válido en `Authorization: Bearer`
- **THEN** la respuesta es 200 con `{ "data": { "id", "fullName", "email", "createdAt", "updatedAt", "initials" } }` y sin contraseña

#### Scenario: Iniciales derivadas

- **WHEN** el usuario tiene `fullName` con al menos dos palabras (por ejemplo "Ada Lovelace")
- **THEN** `initials` contiene la primera letra de las dos primeras palabras en mayúsculas ("AL")

#### Scenario: Iniciales con nombre de una sola palabra

- **WHEN** el usuario tiene `fullName` de una sola palabra (por ejemplo "Ada")
- **THEN** `initials` contiene las dos primeras letras de esa palabra en mayúsculas ("AD"), o la única letra si la palabra tiene una sola

#### Scenario: Iniciales sin nombre

- **WHEN** el usuario tiene `fullName` igual a `null` y su email es, por ejemplo, `ada@example.com`
- **THEN** `initials` contiene la primera letra de lo que hay antes de la arroba y la primera letra de lo que hay después, en mayúsculas ("AE")

### Requirement: Cierre de sesión

El sistema SHALL invalidar con `POST /api/v1/account/logout` únicamente el token con el que se hace la petición.

#### Scenario: Logout correcto

- **WHEN** se hace `POST /api/v1/account/logout` con un token válido
- **THEN** la respuesta es 200 con `{ "message": "Logged out successfully" }` (sin envoltorio `data`) y, a partir de ese momento, ese token recibe 401 en cualquier ruta protegida

#### Scenario: Otras sesiones no se ven afectadas

- **WHEN** un usuario con dos tokens válidos cierra sesión con uno de ellos
- **THEN** el otro token sigue permitiendo consultar el perfil

### Requirement: Protección de rutas de cuenta

El sistema SHALL exigir un token de acceso válido en las rutas de `/api/v1/account/*` y SHALL responder 401 cuando falte o no sea válido. Las rutas de `/api/v1/auth/*` SHALL ser accesibles sin autenticación.

#### Scenario: Sin cabecera de autorización

- **WHEN** se hace `GET /api/v1/account/profile` o `POST /api/v1/account/logout` sin cabecera `Authorization`
- **THEN** la respuesta es 401

#### Scenario: Token inválido

- **WHEN** se hace una petición a una ruta de cuenta con un token inventado, manipulado o ya cerrado
- **THEN** la respuesta es 401

#### Scenario: Token presentado en rutas públicas

- **WHEN** se hace login o registro con un token válido ya presente en la cabecera
- **THEN** la petición se procesa igual que sin token; estar autenticado no bloquea ni cambia estas rutas

### Requirement: Formato JSON de las respuestas

El sistema SHALL responder siempre en JSON, con independencia de la cabecera `Accept` enviada, y SHALL envolver los datos correctos de cuenta bajo la clave `data` (salvo el mensaje de logout).

#### Scenario: Cabecera Accept distinta

- **WHEN** se hace cualquier petición de cuenta con `Accept: text/html`
- **THEN** la respuesta, incluidos los errores 401 y 422, sigue siendo JSON

### Requirement: Pantalla de inicio de sesión

La aplicación SHALL ofrecer en `/login` un formulario con los campos Email y Contraseña y un botón «Entrar», además de un enlace «Crea una» hacia el registro.

#### Scenario: Login correcto

- **WHEN** una persona sin sesión introduce un email y una contraseña correctos en `/login` y pulsa «Entrar»
- **THEN** el botón muestra «Entrando…» y queda desactivado mientras dura la petición y, al terminar, entra con sesión iniciada y ve su perfil en `/profile`

#### Scenario: Credenciales incorrectas

- **WHEN** envía el login con un email o contraseña que no corresponden a una cuenta
- **THEN** ve arriba del formulario el aviso «El email o la contraseña no son correctos.», permanece en `/login` y el botón vuelve a estar activo

#### Scenario: Campo con error de validación

- **WHEN** envía el login con el email vacío o con formato de correo inválido
- **THEN** ve bajo ese campo un mensaje en castellano (por ejemplo «Introduce una dirección de email válida.» o «Falta rellenar el email.») y no entra

#### Scenario: Servidor inaccesible

- **WHEN** envía el login y el servidor no responde
- **THEN** ve el aviso «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.»

#### Scenario: Ir al registro

- **WHEN** pulsa «Crea una» bajo el formulario
- **THEN** navega a `/register`

### Requirement: Pantalla de registro

La aplicación SHALL ofrecer en `/register` un formulario con Nombre completo (marcado como opcional), Email, Contraseña (con la indicación «Entre 8 y 32 caracteres.») y Repite la contraseña, con un botón «Crear cuenta» y un enlace «Inicia sesión» hacia el login.

#### Scenario: Registro correcto

- **WHEN** una persona sin sesión rellena email, contraseña y confirmación válidas, deja o no el nombre, y pulsa «Crear cuenta»
- **THEN** el botón muestra «Creando cuenta…» y queda desactivado durante la petición y, al terminar, entra con la sesión ya iniciada y ve su perfil, sin tener que hacer login

#### Scenario: Nombre en blanco

- **WHEN** deja el nombre vacío o solo con espacios
- **THEN** la cuenta se crea igualmente y su perfil muestra «Sin nombre»

#### Scenario: Contraseñas distintas

- **WHEN** la contraseña y su repetición no coinciden
- **THEN** ve bajo «Repite la contraseña» el mensaje «Las contraseñas no coinciden.» al instante, sin esperar al servidor, y no se crea la cuenta

#### Scenario: Email ya registrado

- **WHEN** envía el registro con un email que ya tiene cuenta
- **THEN** ve bajo Email el mensaje «Ese email ya está registrado. Inicia sesión en su lugar.»

#### Scenario: Contraseña demasiado corta o larga

- **WHEN** envía una contraseña de menos de 8 o más de 32 caracteres
- **THEN** ve bajo Contraseña un mensaje que indica el mínimo («al menos 8 caracteres») o el máximo («no puede superar los 32 caracteres»)

#### Scenario: Error general del servidor

- **WHEN** el registro falla por un error que no corresponde a ningún campo visible
- **THEN** ve un aviso general arriba del formulario en lugar de un mensaje bajo un campo

#### Scenario: Ir al login

- **WHEN** pulsa «Inicia sesión» bajo el formulario
- **THEN** navega a `/login`

### Requirement: Perfil de la persona autenticada

La aplicación SHALL mostrar en `/profile` las iniciales, el nombre completo (o «Sin nombre»), el email y la fecha «Miembro desde» (fecha larga en castellano), junto a un botón «Cerrar sesión».

#### Scenario: Ver el perfil

- **WHEN** una persona con sesión válida abre `/profile`
- **THEN** ve sus iniciales en un círculo, su nombre y su email, y «Miembro desde» con la fecha de creación de su cuenta

### Requirement: Restauración de la sesión al recargar

La aplicación SHALL conservar la sesión entre recargas y visitas mientras el servidor siga reconociendo el token guardado, y SHALL validarlo antes de dar la sesión por buena.

#### Scenario: Recarga con sesión válida

- **WHEN** una persona con sesión iniciada recarga la página, esté en `/profile` o en cualquier otra dirección
- **THEN** ve brevemente una pantalla de carga («Cargando…») sin ser redirigida a `/login` y, a continuación, ve su perfil

#### Scenario: Token rechazado por el servidor

- **WHEN** abre la aplicación con un token guardado que el servidor rechaza (caducado, cerrado desde otra parte o manipulado)
- **THEN** la sesión se descarta, el token guardado se borra, llega a `/login` y ve arriba del formulario el aviso «Tu sesión ha caducado. Vuelve a iniciar sesión.»

#### Scenario: Servidor caído al recargar

- **WHEN** abre la aplicación con un token guardado y el servidor no responde o falla con un error interno
- **THEN** llega a `/login` con un aviso de que no se pudo conectar con el servidor o de que algo ha ido mal, y el token guardado se conserva, de modo que recargar cuando el servidor vuelva restaura la sesión sin volver a escribir la contraseña

#### Scenario: Aviso de sesión perdida se retira

- **WHEN** ha visto el aviso de sesión perdida y luego inicia sesión correctamente
- **THEN** el aviso desaparece

#### Scenario: Sin token guardado

- **WHEN** una persona que nunca inició sesión (o que cerró sesión) abre la aplicación
- **THEN** no ve pantalla de carga ni aviso alguno y accede directamente a las pantallas públicas

### Requirement: Cierre de sesión desde la interfaz

La aplicación SHALL cerrar la sesión con el botón «Cerrar sesión» del perfil y SHALL llevar a la persona a `/login` sin avisos de error.

#### Scenario: Cerrar sesión

- **WHEN** una persona con sesión pulsa «Cerrar sesión»
- **THEN** el botón muestra «Cerrando sesión…» y queda desactivado, llega a `/login` con el formulario vacío y sin ningún aviso, y el token guardado se borra, por lo que recargar la página no restaura la sesión

#### Scenario: Cerrar sesión con el servidor inaccesible o con token ya inválido

- **WHEN** pulsa «Cerrar sesión» y la petición al servidor falla o el token ya no valía
- **THEN** la sesión se cierra igualmente en el navegador y llega a `/login` sin ver ningún error

#### Scenario: Volver atrás tras salir

- **WHEN** ha cerrado sesión y usa el botón «Atrás» del navegador o escribe `/profile`
- **THEN** es redirigida a `/login` en lugar de ver el perfil

### Requirement: Protección de rutas en la interfaz

La aplicación SHALL permitir `/profile` solo con sesión válida y `/login` y `/register` solo sin sesión, y SHALL redirigir cualquier otra dirección a `/profile`.

#### Scenario: Perfil sin sesión

- **WHEN** una persona sin sesión abre `/profile`
- **THEN** es redirigida a `/login`

#### Scenario: Login o registro con sesión

- **WHEN** una persona con sesión válida abre `/login` o `/register`
- **THEN** es redirigida a `/profile`

#### Scenario: Dirección desconocida

- **WHEN** abre una dirección que no existe, por ejemplo `/tareas`
- **THEN** es redirigida a `/profile` y, si no tiene sesión, de ahí a `/login`

#### Scenario: Espera durante la validación

- **WHEN** abre cualquier dirección protegida o pública con un token guardado aún sin validar
- **THEN** ve la pantalla de carga y no se decide ninguna redirección hasta conocer el resultado

### Requirement: Mensajes de error en castellano

La aplicación SHALL mostrar los errores del servidor con frases en castellano que nombren el campo afectado, y SHALL mostrar cada error en un solo sitio: bajo el campo si este está en pantalla, o como aviso general si no.

#### Scenario: Campo obligatorio vacío

- **WHEN** el servidor indica que falta un campo obligatorio
- **THEN** ve «Falta rellenar» seguido del nombre del campo (el email, la contraseña, la confirmación de la contraseña)

#### Scenario: Error inesperado

- **WHEN** ocurre un fallo no previsto al enviar un formulario
- **THEN** ve el aviso «Algo ha ido mal. Inténtalo de nuevo.» o «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.»

# Parte B

### 1. Números

- Requisitos escritos por el agente: 15 (después se eliminó uno, el de caducidad y almacenamiento de credenciales, por no ser observable).
- Requisitos comprobados por mí abriendo el código: 14.

### 2. Incoherencias

- El login no impone longitud mínima a la contraseña, pero el registro sí (8 a 32). Se ve al comparar ambos formularios.
- El mensaje de contraseña corta empieza en minúscula («la contraseña debe tener…») mientras el resto de mensajes empiezan en mayúscula. Se ve en el registro.
- Una ruta inexistente de la API devuelve un volcado con trazas internas en lugar del formato de error habitual. Se ve al pedir una dirección que no existe.
- Un nombre con dos espacios seguidos da iniciales distintas de las esperadas («Ada  Lovelace» sale «AD», no «AL»). Se ve en el perfil.

### 3. Bug o contrato

- Los tokens no caducan nunca, lo que puede ser una decisión de MVP o un descuido, y aun así la interfaz avisa de que la sesión «ha caducado» aunque nada caduca.
- El botón «Cerrando sesión…» puede no llegar a verse porque la sesión se borra y se redirige de inmediato: la spec lo describe como visible, pero el comportamiento real puede no mostrarlo, y no está claro si el error es de la spec o del comportamiento.
- El cierre de sesión en la interfaz no avisa si el servidor falla y el token sigue siendo válido en el servidor: puede ser deliberado o un error que se pierde sin que nadie lo vea.
- Las iniciales sin nombre salen de la mitad del email antes y después de la arroba («ada@example.com» → «AE»): puede ser diseño o accidente.
