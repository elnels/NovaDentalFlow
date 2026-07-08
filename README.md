# DentalFlow 🦷

**Una plataforma de gestión de pacientes y citas, open-source y gratuita, diseñada para consultorios dentales modernos. Creada con Next.js y PostgreSQL.**

---

### ✨ Descripción del Proyecto

**DentalFlow** es una aplicación web intuitiva y potente que simplifica la administración de un consultorio dental. Permite registrar pacientes, agendar citas y llevar un historial clínico detallado, todo desde una interfaz limpia y accesible.

Utiliza **PostgreSQL como base de datos** corriendo en Docker para un rendimiento confiable y escalable. Este repositorio contiene todo el código fuente y las instrucciones para que puedas desplegar tu propia versión de DentalFlow de forma **completamente gratuita**.

### 🚀 Características Principales

*   **Registro de Pacientes en 3 Pasos:**
    1.  **Datos Personales:** Captura la información esencial del paciente.
    2.  **Historial Clínico (6 sub-pasos):** Desde la ficha de revisión (HC1) hasta el odontograma interactivo (HC6) con antecedentes, exploración bucal y más.
    3.  **Gestión de Citas:** Agenda la primera cita (fecha, hora, doctor).
*   **Panel de Gestión de Pacientes:**
    *   Visualiza a todos tus pacientes en una tabla clara, ordenada por la cita más próxima.
    *   Accede al perfil individual de cada paciente con un solo clic.
*   **Perfil del Paciente con 5 Pestañas:**
    *   **Paciente:** Datos personales completos con botón Editar.
    *   **Historial de Tratamientos:** Registros clínicos en formato de tarjetas.
    *   **Citas:** Calendario de citas programadas.
    *   **Historia Clínica:** HC1–HC5 en secciones editables vía diálogos.
    *   **Odontograma:** Interactivo en modo oscuro con panel de 3 pestañas (Estado/Notas/Historial).
*   **Odontograma Interactivo:** Selecciona dientes, aplica estados (caries, obturado, corona, etc.) por superficie vía SVG interactivo. Soporte para dientes temporales. Guardado/carga desde la base de datos.
*   **Catálogo de Procedimientos:** Administre precios y procedimientos desde una página CRUD dedicada (`/catalogo-procedimientos`). Incluye 25 procedimientos comunes pre-cargados.
*   **Costos por Procedimiento:** En lugar de un costo único por visita, los tratamientos ahora se registran como una lista detallada de procedimientos con cantidades, honorarios y descuentos — el total se calcula automáticamente.
*   **Selección Inteligente de Procedimientos:** Componente `ProcedurePicker` con búsqueda por nombre/código para agregar procedimientos rápidamente desde el catálogo.
*   **Historial Clínico en 6 Sub-pasos:** HC1 (Revisión), HC2 (Antecedentes Personales), HC3 (Heredo-Familiares), HC4 (No Patológicos), HC5 (Exploración Bucal), HC6 (Odontograma).
*   **Base de datos local con PostgreSQL:** Datos persistentes y consultas eficientes a través de Prisma ORM.
*   **Sincronización con Google Calendar:** Opcional, bidireccional para citas.

### 🛠️ Stack Tecnológico

*   **Framework Frontend:** [Next.js](https://nextjs.org/)
*   **Librería UI:** [React](https://reactjs.org/)
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
*   **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) via [Docker](https://www.docker.com/)
*   **Alojamiento:** Local con Docker

---

## ⚙️ Guía de Instalación y Despliegue

Sigue estos pasos para tener tu propia versión de DentalFlow funcionando en minutos.

### **Paso 1: Configurar la Base de Datos (PostgreSQL con Docker)**

1.  **Instala Docker Desktop** en tu máquina si no lo tienes (https://www.docker.com/products/docker-desktop/).

2.  **Inicia el contenedor de PostgreSQL:**

    ```bash
    docker compose up -d
    ```

    Esto creará un contenedor con PostgreSQL 16 en el puerto `5432`.

3.  **Ejecuta las migraciones de Prisma:**

    ```bash
    npx prisma migrate dev
    ```

4.  **(Opcional) Siembra datos de ejemplo:**

    ```bash
    npx prisma db seed
    ```

### **Paso 2: Configurar el Proyecto Frontend (Next.js)**

1.  **Clona el Repositorio:**
    *   Abre una terminal en tu computadora y ejecuta el siguiente comando:
      ```bash
      git clone https://github.com/tu-usuario/dentalflow.git
      cd dentalflow
      ```

2.  **Instala las Dependencias:**
    ```bash
    npm install
    ```

3.  **Actualiza tu Proyecto en GitHub:**
    *   Después de hacer cambios, usa estos comandos para subir tus actualizaciones a tu repositorio.

    *   **Paso A: Prepara los archivos**
        ```bash
        # El punto (.) agrega todos los archivos modificados
        git add .
        ```

    *   **Paso B: Guarda los cambios con un mensaje**
        ```bash
        # El mensaje describe el cambio que hiciste
        git commit -m "Actualizo el archivo README"
        ```

    *   **Paso C: Sube los cambios a GitHub**
        ```bash
        # Esto envía tus cambios a la nube
        git push
        ```

### **Paso 3: Ejecutar el Proyecto Localmente**

Sigue estos pasos para ejecutar DentalFlow en tu máquina local:

1.  **Crear el archivo de entorno**

    Copia `.env.example` a `.env` o crea el archivo con las siguientes variables:

    ```bash
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/novadentalflow
    DB_PASSWORD=postgres
    TIMEZONE=America/Mexico_City
    ```

2.  **Configurar el Calendario (Opcional)**

    Si deseas usar la sincronización con Google Calendar, agrega el ID de tu calendario al archivo `.env`:

    ```bash
    NEXT_PUBLIC_GOOGLE_CALENDAR_ID=tu-calendario@gmail.com
    ```

    También necesitas un archivo de credenciales de servicio de Google (`gcp-service-account-key.json`) en la raíz del proyecto y configurar `GOOGLE_APPLICATION_CREDENTIALS` en `.env`.

    Luego comparte tu calendario con el email de la cuenta de servicio desde la configuración de Google Calendar (el calendario no necesita ser público).

3.  **Instalar dependencias**

    Ejecuta `npm install`. Si PowerShell bloquea la ejecución de scripts (error con `npm.ps1`), usa una de estas opciones:

    - Temporalmente para la sesión actual (PowerShell):
      ```powershell
      Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
      npm install
      ```

    - Usar el wrapper de CMD sin cambiar la política:
      ```powershell
      npm.cmd install
      ```

    - O abrir una terminal `cmd.exe` y ejecutar:
      ```cmd
      npm install
      ```

4.  **Ejecutar en desarrollo**

    Inicia el servidor de desarrollo (por defecto escucha en el puerto `9004` según `package.json`):

    ```bash
    npm run dev
    ```

    Luego abre `http://localhost:9004` en tu navegador.

5.  **Compilar y ejecutar la versión de producción (opcional)**

    ```bash
    npm run build
    npm run start
    ```

6.  **Ejecutar pruebas automatizadas**

    ```bash
    npm test           # ejecutar una vez
    npm run test:watch # modo vigilancia (watch)
    ```

7.  **Scripts adicionales**

    - Para trabajar con `genkit` (si lo usas):
      - `npm run genkit:dev` — inicia `genkit` con `src/ai/dev.ts`.
      - `npm run genkit:watch` — lo mismo en modo watch.

Nota: No es necesario cambiar la política de ejecución del sistema de forma permanente; la opción `-Scope Process` solo afecta la sesión actual y es la más segura para desarrollo local.

---

### **Nota: Mantener este repositorio solo localmente (no subir)**

Si quieres trabajar en tu copia local y evitar subir cambios al repositorio original, puedes desvincular el `remote` o usar una rama/local-only.

- Para eliminar la referencia al repositorio remoto (no se podrá hacer `git push` accidentalmente):

```bash
# elimina el remote llamado 'origin'
git remote remove origin
```

- Si prefieres mantener el `remote` pero evitar pushes accidentales, configura el siguiente alias seguro:

```bash
git config --local --add remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git config --local receive.denyCurrentBranch updateInstead
```

- Otra opción: crear un nuevo repositorio privado y enlazarlo como `origin` si más tarde quieres respaldar los cambios:

```bash
git remote add origin https://github.com/tu-usuario/tu-repo-privado.git
git push -u origin main
```

Ejecuta estos comandos desde la carpeta del proyecto. Dime si quieres que los ejecute por ti en la terminal o prefieres que te guíe paso a paso.

### 👨‍💻 Acerca del Desarrollo

Este proyecto fue desarrollado por **[BillCodex](https://www.billcodex.com)** como una solución de código abierto para la comunidad de profesionales de la salud.

### 💬 Comentarios y Futuros Proyectos

¿Te ha sido útil esta plataforma? ¿Tienes alguna sugerencia? ¡Házmelo saber!

Déjame un comentario o abre un *issue* en GitHub. ¿Qué otro tipo de proyecto te gustaría que construyéramos y compartiéramos con la comunidad?

---

### 📄 Licencia

Este proyecto se distribuye bajo la licencia Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International.
*Puedes ver el texto completo de la licencia aquí: (https://creativecommons.org/licenses/by-nc-sa/4.0/)*

Esto significa que eres libre de:

Compartir — copiar y redistribuir el material en cualquier medio o formato.
Adaptar — remezclar, transformar y construir sobre el material.

Bajo las siguientes condiciones:

Atribución — Debes dar el crédito apropiado, proporcionar un enlace a la licencia e indicar si se realizaron cambios.
No Comercial — No puedes utilizar el material para fines comerciales.
Compartir Igual — Si remezclas, transformas o creas a partir del material, debes distribuir tus contribuciones bajo la misma licencia que el original.

En resumen: puedes usar y modificar este proyecto para fines personales o educativos, pero no para crear un producto comercial o venderlo.
