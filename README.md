# Asistente de Normatividad Ambiental Mexicana

Este proyecto es una página web informativa sobre el Marco Normativo Ambiental Mexicano 2025, que incluye un asistente de IA para responder preguntas sobre la normativa.

## Descripción

La aplicación consta de dos partes:
1.  **Frontend:** Una página `index.html` estática que muestra la información y la interfaz del asistente.
2.  **Backend:** Un servidor simple hecho con Python y Flask que actúa como un proxy seguro para la API de Google Generative AI, protegiendo la clave de la API.

## Cómo ejecutar el proyecto

Sigue estos pasos para levantar el proyecto en tu máquina local.

### Prerrequisitos

- Python 3.7 o superior
- pip (manejador de paquetes de Python)

### 1. Clona el repositorio (si aplica)

Si estás trabajando con git, clona el repositorio a tu máquina local.

### 2. Instala las dependencias

El backend requiere algunas librerías de Python. Instálalas usando el archivo `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 3. Configura tu clave de API

Para que el asistente de IA funcione, necesitas tu propia clave de API de Google AI Studio.

1.  Crea un archivo llamado `.env` en la raíz del proyecto. Puedes copiar el archivo `.env.example` como plantilla.
2.  Dentro del archivo `.env`, añade tu clave de API de la siguiente manera:

    ```
    GOOGLE_API_KEY=TU_CLAVE_DE_API_AQUI
    ```

    Reemplaza `TU_CLAVE_DE_API_AQUI` con tu clave real.

### 4. Ejecuta el servidor backend

Una vez instaladas las dependencias y configurada la clave, puedes iniciar el servidor:

```bash
python app.py
```

El servidor se ejecutará en `http://127.0.0.1:5000`. Deberías ver un mensaje indicando que el servidor está corriendo.

### 5. Abre el frontend

Abre el archivo `seguridad/index.html` directamente en tu navegador web (por ejemplo, Chrome, Firefox).

¡Listo! Ahora puedes interactuar con el asistente de IA en la página. El frontend se comunicará de forma segura con tu backend local.
