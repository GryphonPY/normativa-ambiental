# Explicación del Proyecto: Página Web con Asistente de IA

¡Hola! Este archivo explica de manera sencilla cómo funciona tu página web y su asistente de IA.

## ¿Qué es este proyecto?

Este es un sitio web "estático" (lo que significa que el contenido principal no cambia dinámicamente) que tiene una función especial: un **asistente de IA** que puede responder preguntas sobre la normativa ambiental mexicana.

El proyecto está dividido en dos partes principales:

1.  **Frontend:** Lo que ves y con lo que interactúas en tu navegador.
2.  **Backend:** El "cerebro" que funciona en la nube (en los servidores de Netlify) y hace el trabajo pesado.

---

## 1. El Frontend (Lo que ves en el navegador)

El frontend está compuesto principalmente por un archivo:

### `seguridad/index.html`

-   Este es el corazón de tu página web. Contiene todo el texto, las imágenes, los títulos y los estilos que ves.
-   Dentro de este archivo, hay una sección clave: **"Asistente de Normatividad"**.
-   Esta sección tiene un campo de texto para escribir una pregunta y un botón de "Preguntar".
-   También contiene un pequeño código en **JavaScript** que se activa cuando haces clic en el botón.

#### ¿Qué hace el código JavaScript?

1.  Toma la pregunta que escribiste en el campo de texto.
2.  Envía esa pregunta a una URL especial y simplificada: `/api/ask-ai`.
3.  Espera pacientemente a que el "cerebro" (el backend) le envíe una respuesta.
4.  Cuando recibe la respuesta, la muestra en la pantalla, debajo del botón.

**Importante:** El frontend **nunca** conoce tu clave de API secreta. Solo sabe a qué URL debe enviar la pregunta.

---

## 2. El Backend (El cerebro en la nube)

El backend es una **Función Serverless** (o función sin servidor) de Netlify. Esto significa que es un pequeño programa que vive en los servidores de Netlify y solo se "despierta" y se ejecuta cuando se le necesita.

### `netlify/functions/ask-ai.js`

-   Este archivo es el "cerebro". Está escrito en JavaScript (Node.js) porque es uno de los lenguajes que Netlify entiende para sus funciones.
-   No se ejecuta en tu navegador, sino en un entorno seguro en Netlify.

#### ¿Qué hace esta función?

1.  **Espera una llamada:** Se activa cada vez que el frontend envía una solicitud a la URL `/api/ask-ai`.
2.  **Recibe la pregunta:** Toma la pregunta que el frontend le envió.
3.  **Usa el secreto:** De forma segura, lee la variable de entorno `GOOGLE_API_KEY` que guardaste en la configuración de tu sitio en Netlify. **Esta clave es invisible para el mundo exterior.**
4.  **Habla con Google:** Usa esa clave secreta para conectarse al servicio de IA de Google y le pasa la pregunta del usuario.
5.  **Obtiene la respuesta:** Recibe la respuesta directamente de la IA de Google.
6.  **Devuelve el resultado:** Envía únicamente el texto de la respuesta de vuelta al frontend.

---

## 3. Los Archivos de Configuración (Las instrucciones para Netlify)

Estos archivos le dicen a Netlify cómo construir y desplegar tu sitio correctamente.

### `netlify.toml`

Este es el archivo de configuración principal de Netlify. Le da tres instrucciones clave:

-   `publish = "seguridad/"`: "Oye Netlify, la carpeta que contiene la página web que debes mostrar al mundo es la carpeta `seguridad`".
-   `directory = "netlify/functions/"`: "El 'cerebro' o las funciones de backend se encuentran en la carpeta `netlify/functions`".
-   **La regla de redirección (`[[redirects]]`)**: Esta es una parte muy importante. La línea `from = "/api/*"` a `to = "/.netlify/functions/:splat"` es una instrucción inteligente que dice: "Si alguien intenta acceder a una URL que empieza con `/api/` (como `/api/ask-ai`), no busques un archivo ahí. En lugar de eso, y de forma interna, pasa esa solicitud a la función correspondiente que vive en `/.netlify/functions/`". Esto hace que la URL que usa el frontend sea más corta, limpia y profesional.

### `package.json`

-   Este archivo es como una lista de compras para el "cerebro" (`ask-ai.js`).
-   Le dice a Netlify qué **herramientas de Node.js** (llamadas dependencias) necesita la función para poder funcionar.
-   En este caso, le dice que necesita instalar el paquete `@google/generative-ai`, que es la herramienta oficial de Google para usar su IA.
-   Netlify lee este archivo y automáticamente descarga e instala esta herramienta en el entorno del servidor antes de poner la función en línea.

¡Y así es como todas las piezas se unen para crear tu increíble página con un asistente de IA seguro y funcional!
