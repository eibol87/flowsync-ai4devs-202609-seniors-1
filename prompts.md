# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

Borra el ejemplo de abajo cuando escribas el primero.

---

## Prompt 1

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Lee el vertical de cuentas y acceso del backend (registro, login, logout, perfil, validación, modelo de usuario, middlewares de autenticación). Escribe en docs/spec-viva/ach.md la spec de lo que hace HOY, sin tocar código. Formato: ## Purpose (1-2 frases), ## Requirements, con ### Requirement: usando SHALL y al menos un #### Scenario: con **WHEN** y **THEN** (la precondición va dentro del WHEN). En castellano. Sin ADDED/MODIFIED/REMOVED. Solo comportamiento observable (petición y respuesta): ni nombres de clase, de fichero ni rutas de código. Solo cuentas y acceso.
```

**Qué salió:** Escribí la spec. Ahora compruebo dos afirmaciones que no he verificado: que los tokens no caducan por defecto y que fullName es obligatorio aunque admita null.

## Prompt 2

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Añade a la misma spec los requisitos del frontend: pantallas de acceso, estado de sesión (qué pasa al recargar, con token inválido, al salir) y protección de rutas. Mismas reglas de formato. Solo lo que una persona ve y puede hacer. Sin nombres de componentes ni ficheros.
```

**Qué salió:** Cubre registro, validación del registro, login, perfil, logout, protección de rutas, respuestas siempre en JSON, y caducidad y almacenamiento de credenciales.

- Verificado en las dependencias: el 400 de credenciales inválidas y que el token se crea sin caducidad, porque nada en el código pasa una duración.
- Sin comprobar ejecutando: el 401 en rutas protegidas, el 422 del registro y que fullName ausente da error aunque admita null.
- Sin comprobar y que podría no cumplirse: que login y registro ignoran un token presente en la cabecera. Lo deduzco de que la comprobación de sesión no bloquea esas rutas.

No hice commit ni PR, porque pediste solo el fichero.

## Prompt 3

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
@docs/spec-viva/ach.md  haz las siguientes 3 correciones, sin tocar nada mas 1. En el requisito «Consulta del perfil», el escenario «Iniciales sin nombre completo» es incorrecto. Lee el cálculo de las iniciales en el modelo de usuario del backend y reescribe el escenario para que describa lo que hace hoy el código cuando el usuario no tiene fullName (se parte el email por la arroba) y cuando tiene una sola palabra. Describe el resultado observable, sin nombres de fichero ni de clase.
▎ 2. Elimina el requisito «Caducidad y almacenamiento de credenciales» entero, porque no es comportamiento observable.
▎ 3. En todos los escenarios, pasa las líneas que empiezan por **AND** a la línea **THEN** correspondiente, de forma que cada escenario tenga solo una viñeta **WHEN** y una **THEN**.
```

**Qué salió:** Hice las tres correcciones en docs/spec-viva/ach.md y no toqué nada más. Después comprobé que no queda ningún AND ni el requisito eliminado, y que hay 48 escenarios con 48 WHEN y 48 THEN.

1. Iniciales: el escenario antiguo era incorrecto. Si no hay fullName, el código parte el email por la arroba y usa la primera letra de cada mitad. Así, [ada@example.com](mailto:ada@example.com) da "AE", no "AD". Con un nombre de una sola palabra, da sus dos primeras letras en mayúsculas ("Ada" da "AD"), o una sola letra si la palabra tiene una. Como los dos casos dan resultados distintos, los separé en dos escenarios, «Iniciales con nombre de una sola palabra» e «Iniciales sin nombre». Así cada uno cumple una sola viñeta WHEN y una THEN.
2. Requisito eliminado: borré «Caducidad y almacenamiento de credenciales» entero, con sus dos escenarios.
3. AND: fusioné nueve líneas en su THEN, unidas con comas o «y». Afecta a los escenarios de registro correcto, logout correcto, login correcto, registro en pantalla, recarga con sesión válida, token rechazado, servidor caído y cerrar sesión. Las frases conservan su texto.

Un caso límite del cálculo de iniciales queda fuera de la spec: con un fullName de dos palabras separadas por dos espacios seguidos, el código devuelve las dos primeras letras de la primera palabra en lugar de una letra por palabra.

## Prompt 4

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Tienes docs/spec-viva/ach.md, una spec de cuentas y acceso (backend AdonisJS en backend/, frontend React en frontend/). Añade al FINAL del fichero una sección # Parte B con tres listas. No modifiques nada de lo que ya hay en el fichero ni toques código.
▎
▎ Reglas: en castellano. Sin nombres de fichero ni de clase. No inventes ningún dato: usa solo lo que te doy aquí.
▎
▎ ### 1. Números
▎ - Requisitos escritos por el agente: 15 (después se eliminó uno, el de caducidad y almacenamiento de credenciales, por no ser observable)
▎ - Requisitos comprobados por mí abriendo el código: 14
▎
▎ ### 2. Incoherencias: una línea cada una, con dónde se ve. Usa solo estas:
▎ - El login no impone longitud mínima a la contraseña, pero el registro sí (8 a 32). Se ve al comparar ambos formularios.
▎ - El mensaje de contraseña corta empieza en minúscula («la contraseña debe tener…») mientras el resto de mensajes empiezan en mayúscula. Se ve en el registro.
▎ - Una ruta inexistente de la API devuelve un volcado con trazas internas en lugar del formato de error habitual. Se ve al pedir una dirección que no existe.
▎ - Un nombre con dos espacios seguidos da iniciales distintas de las esperadas («Ada  Lovelace» sale «AD», no «AL»). Se ve en el perfil.
▎
▎ ### 3. Bug o contrato: para cada elemento, una frase que diga qué dos lecturas se contradicen. Usa solo estos:
▎ - Los tokens no caducan nunca: decisión de MVP o descuido, y la interfaz avisa de que la sesión «ha caducado» aunque nada caduca.
▎ - El botón «Cerrando sesión…» puede no llegar a verse porque la sesión se borra y se redirige de inmediato: ¿error de la spec o del comportamiento?
▎ - El cierre de sesión en la interfaz no avisa si el servidor falla, y el token sigue siendo válido en el servidor: ¿deliberado o se pierde el error?
▎ - Las iniciales sin nombre salen de la mitad del email antes y después de la arroba («ada@example.com» → «AE»): ¿diseño o accidente?
▎
▎ No redondees los números ni expliques de más. No añadas elementos que no te haya dado.
```

**Qué salió:** Añadí al final de docs/spec-viva/ach.md la sección # Parte B con las tres listas. No modifiqué nada de lo anterior ni toqué código.

- Números: 15 requisitos escritos por el agente y 14 comprobados por ti en el código, tal cual.

- Incoherencias: las cuatro que me diste, una línea cada una y con dónde se ve.

- Bug o contrato: los cuatro elementos, una frase cada uno. En los que solo me diste la pregunta, la frase dice cuáles son las dos lecturas en juego y no añade ningún dato nuevo.

No relancé la comprobación del fichero tras escribir. El comando de revisión final falló por una opción que macOS no admite, así que solo consta que el bloque se añadió.

Tu petición anterior (el prompt 14) quedó sin respuesta: prompts.md solo tiene 3 entradas. Si querías otro, dime cuál.