# Reporte y Consideraciones del Proyecto: Asistente de Normativa Ambiental

Estimada Profesora,

Este documento detalla el estado actual del proyecto de la página web sobre el **Marco Normativo Ambiental Mexicano**. Mi objetivo es explicarle de forma clara las capacidades del proyecto y, más importante aún, las consideraciones que deje de lado al ser un proyecto pequeño, técnicas y de seguridad para su posible uso a futuro que quiera escalarlo.

---

### ⚠️ Advertencia Crítica de Seguridad: La "Contraseña" de la IA está visible

Este es el punto más importante a considerar desde una perspectiva de seguridad.

> **La "llave de acceso" (conocida como API Key) que permite a la página conectarse con la Inteligencia Artificial de Google está escrita directamente en el código de la página web.**

Esto significa que una persona con conocimientos técnicos podría encontrarla y usarla libremente. Sería el equivalente a dejar la contraseña de un servicio importante pegada en una nota a la vista de todos. Esto podría resultar en que personas no autorizadas usen el servicio a nuestro nombre, generando costos o haciendo un mal uso de la herramienta.

Hice esto por una limitación del proyecto escolar, ya que no contaba con un **servidor privado (backend)** para ocultarla. La manera correcta de hacerlo es guardar esa "llave" en un servidor seguro, para que nadie pueda verla.

**Recomendación:** Es muy importante que la página no se use de forma pública hasta que esta "llave de acceso" se guarde en un lugar seguro.

---

### 💰 Análisis de Costos: ¿Qué pasaría si esta página se usara a gran escala?

Para este proyecto, usé un acceso gratuito que ofrece Google para pruebas y desarrollo. Si la escuela quisiera convertir esto en una herramienta oficial para muchos usuarios, los costos aumentarían. Hay dos caminos principales:

#### Opción 1: Pagar por el servicio de una empresa (como Google, OpenAI, etc.)
Es como pagar el recibo de la luz: se paga solo por lo que se consume. Cada vez que un usuario hace una pregunta, se genera un pequeño costo.
- **Ventajas:** No hay que comprar equipo caro. El mantenimiento lo hace Google.
- **Desventajas:** Si muchas personas usan la página, la "factura" mensual podría ser alta.

#### Opción 2: Usar un modelo de IA "Gratuito" (Open Source)
Es como construir nuestra propia planta de energía en lugar de pagarle a la compañía eléctrica. usar un modelo de inteligencia artifical como chatgpt pero desarrollado por personas que decidieron dejarlo al publico, pero alojandolo y corriendo en servidores de la utt, El programa de IA es gratis, pero nosotros tendríamos que comprar y mantener las computadoras.
- **Ventajas:** Se tiene control total y no se paga por cada pregunta.
- **Desventajas:** Se necesita equipo muy potente y costoso (servidores con tarjetas gráficas especiales, o GPUs) y personal técnico que lo mantenga funcionando. La inversión inicial es muy alta.

**En resumen:** Ofrecer un servicio de IA al público es costoso, ya sea pagando por uso o invirtiendo fuertemente en equipo propio.

---

### 🧠 Fiabilidad y Limitaciones de la Inteligencia Artificial

Es crucial entender que la IA no es perfecta:

1.  **Puede cometer errores (o "alucinar"):** A veces, la IA puede generar respuestas que suenan muy convincentes pero que son incorrectas. Aunque la programé para que solo busque información en sitios del gobierno mexicano, el riesgo de error nunca es cero.
2.  **Dependemos de Google:** La página funciona gracias a que se conecta al servicio de Google. Si el servicio de Google tiene fallas o funciona lento, nuestra página también lo hará. Esto es algo que no podemos controlar directamente.

---

### 🛠️ Soporte y Ayuda

A pesar de que me menciono que la herramienta no funcionaba yo la probe y realmente todo funciona bien si puede mandarme un clip replicando el error con gusto veo que sucede y se lo corrijo

---

### 🎨 Cómo Personalizar la Página

Si desean hacer cambios visuales, como añadir el logo de la escuela, las modificaciones se hacen en el archivo `index.html`:

-   **Textos:** La mayoría de los textos se pueden editar directamente en el archivo.
-   **Imágenes:** Para cambiar una imagen, hay que buscarla en el código (dentro de una etiqueta `<img>`) y cambiar la dirección web de la imagen.
-   **Colores:** Los colores principales están definidos al inicio del documento y se pueden cambiar ahí mismo.

Espero que este reporte sea claro y de gran utilidad. Ha sido un proyecto muy interesante y educativo.

Atentamente,

Axel Johann Vázquez Cruz

---
---

### Glosario de Términos

-   **API Key (Llave de Acceso):** Es una "contraseña" que le da permiso a nuestro programa para usar un servicio externo, en este caso, la Inteligencia Artificial de Google.
-   **Frontend:** Es la parte visible de una página web, todo lo que se ve y con lo que se interactúa en el navegador (Chrome, Firefox, etc.).
-   **Backend (Servidor Privado):** Es una computadora remota y segura que se encarga del trabajo "detrás de cámaras". Es el lugar correcto para guardar información sensible como las "llaves de acceso".
-   **Modelo Open Source:** Se refiere a programas cuyo código es público y gratuito. Cualquiera puede usarlo, pero debe proporcionar su propio equipo para ejecutarlo.
