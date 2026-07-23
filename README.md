# DentalFlow 🦷

**An open-source patient and appointment management platform, designed for modern dental clinics. Built with Next.js and PostgreSQL.**

---

### ✨ Project Description

**DentalFlow** is an intuitive and powerful web application that simplifies dental office administration. Register patients, schedule appointments, and maintain detailed clinical histories — all from a clean, accessible interface.

It uses **PostgreSQL as its database** running in Docker for reliable, scalable performance. This repository contains all the source code and instructions to deploy your own version of DentalFlow **completely free**.

### 🚀 Key Features

*   **3-Step Patient Registration:**
    1.  **Personal Data:** Capture essential patient information.
    2.  **Clinical History (6 sub-steps):** From the initial checkup form (HC1) to the interactive odontogram (HC6) with history, oral examination, and more.
    3.  **Appointment Management:** Schedule the first appointment (date, time, doctor).
*   **Patient Management Panel:**
    *   View all patients in a clear table, sorted by next upcoming appointment.
    *   Access each patient's individual profile with a single click.
*   **Patient Profile with 5 Tabs:**
    *   **Patient:** Full personal data with Edit button.
    *   **Treatment History:** Clinical records in card format.
    *   **Appointments:** Calendar of scheduled appointments.
    *   **Clinical History:** HC1–HC5 in editable sections via dialogs.
    *   **Odontogram:** Interactive dark-mode chart with a 3-tab panel (Status/Notes/History).
*   **Interactive Odontogram:** Select teeth, apply states (caries, filled, crown, etc.) by surface via interactive SVG. Supports deciduous teeth. Save/load from the database.
*   **Procedure Catalog:** Manage prices and procedures from a dedicated CRUD page (`/catalogo-procedimientos`). Includes 34 pre-loaded common procedures.
*   **Per-Procedure Costs:** Instead of a single cost per visit, treatments are recorded as a detailed list of procedures with quantities, fees, and discounts — the total is calculated automatically.
*   **Smart Procedure Selection:** `ProcedurePicker` component with name/code search to quickly add procedures from the catalog.
*   **Clinical History in 6 Sub-steps:** HC1 (Review), HC2 (Personal History), HC3 (Family History), HC4 (Non-Pathological), HC5 (Oral Examination), HC6 (Odontogram). Includes a PDF print preview step between HC5 and HC6.
*   **Local PostgreSQL Database:** Persistent data and efficient queries via Prisma ORM.
*   **Google Calendar Sync:** Optional bidirectional sync for appointments.
*   **PDF Print Module:** Generate and print patient clinical history (Historia Clínica) as PDF. Includes patient data, HC1–HC5 sections, and configurable clinic branding (name/logo).

### 🛠️ Tech Stack

*   **Frontend Framework:** [Next.js](https://nextjs.org/)
*   **UI Library:** [React](https://reactjs.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/) via [Docker](https://www.docker.com/)
*   **Hosting:** Local with Docker
*   **PDF Generation:** [@react-pdf/renderer](https://react-pdf.org/)

---

## ⚙️ Setup & Deployment Guide

Follow these steps to get your own DentalFlow instance running in minutes.

### **Step 1: Set Up the Database (PostgreSQL with Docker)**

1.  **Install Docker Desktop** on your machine if you don't have it (https://www.docker.com/products/docker-desktop/).

2.  **Start the PostgreSQL container:**

    ```bash
    docker compose up -d
    ```

    This creates a PostgreSQL 16 container on port `5432`.

3.  **Run Prisma migrations:**

    ```bash
    npx prisma migrate dev
    ```

4.  **(Optional) Seed sample data:**

    ```bash
    npx prisma db seed
    ```

### **Step 2: Set Up the Frontend (Next.js)**

1.  **Clone the Repository:**
    *   Open a terminal and run:
      ```bash
      git clone https://github.com/your-username/dentalflow.git
      cd dentalflow
      ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Update Your GitHub Project:**
    *   After making changes, use these commands to push updates.

    *   **Step A: Stage files**
        ```bash
        # The dot (.) stages all modified files
        git add .
        ```

    *   **Step B: Commit changes with a message**
        ```bash
        # The message describes what you changed
        git commit -m "Update README file"
        ```

    *   **Step C: Push changes to GitHub**
        ```bash
        # This sends your changes to the cloud
        git push
        ```

### **Step 3: Run the Project Locally**

1.  **Create the environment file**

    Copy `.env.example` to `.env` or create the file with the following variables:

    ```bash
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/novadentalflow
    DB_PASSWORD=postgres
    TIMEZONE=America/Mexico_City
    ```

2.  **Configure Calendar (Optional)**

    To use Google Calendar sync, add your calendar ID to `.env`:

    ```bash
    NEXT_PUBLIC_GOOGLE_CALENDAR_ID=your-calendar@gmail.com
    ```

    You also need a Google service account key file (`gcp-service-account-key.json`) in the project root and set `GOOGLE_APPLICATION_CREDENTIALS` in `.env`.

    Then share your calendar with the service account email from Google Calendar settings (the calendar does not need to be public).

3.  **Install dependencies**

    Run `npm install`. If PowerShell blocks script execution (error with `npm.ps1`), use one of these options:

    - Temporarily for the current session (PowerShell):
      ```powershell
      Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
      npm install
      ```

    - Use the CMD wrapper without changing policy:
      ```powershell
      npm.cmd install
      ```

    - Or open a `cmd.exe` terminal and run:
      ```cmd
      npm install
      ```

4.  **Run in development mode**

    Start the development server (default port `9004` as set in `package.json`):

    ```bash
    npm run dev
    ```

    Then open `http://localhost:9004` in your browser.

5.  **Build and run production version (optional)**

    ```bash
    npm run build
    npm run start
    ```

6.  **Run automated tests**

    ```bash
    npm test           # run once
    npm run test:watch # watch mode
    ```

7.  **Additional scripts**

    - For working with `genkit` (if you use it):
      - `npm run genkit:dev` — starts `genkit` with `src/ai/dev.ts`.
      - `npm run genkit:watch` — same in watch mode.

Note: No need to permanently change system execution policy; the `-Scope Process` option only affects the current session and is the safest for local development.

---

### **Note: Keeping this repository local only (no push)**

If you want to work on your local copy and avoid pushing changes to the original repository, you can unlink the `remote` or use a local-only branch.

- To remove the remote reference (no accidental `git push`):

```bash
# removes the remote named 'origin'
git remote remove origin
```

- If you prefer to keep the `remote` but avoid accidental pushes, configure this safe alias:

```bash
git config --local --add remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git config --local receive.denyCurrentBranch updateInstead
```

- Another option: create a new private repository and link it as `origin` if you later want to back up changes:

```bash
git remote add origin https://github.com/your-username/your-private-repo.git
git push -u origin main
```

Run these commands from the project folder. Let me know if you want me to execute them for you or prefer step-by-step guidance.

### 👨‍💻 About Development

This project was developed by **[BillCodex](https://www.billcodex.com)** as an open-source solution for the healthcare professional community.

### 💬 Feedback & Future Projects

Was this platform useful? Do you have any suggestions? Let me know!

Leave a comment or open an *issue* on GitHub. What other types of projects would you like us to build and share with the community?

---

### 📄 License

This project is distributed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International license.
*You can view the full license text here: (https://creativecommons.org/licenses/by-nc-sa/4.0/)*

This means you are free to:

Share — copy and redistribute the material in any medium or format.
Adapt — remix, transform, and build upon the material.

Under the following terms:

Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
Non-Commercial — You may not use the material for commercial purposes.
ShareAlike — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.

In summary: you may use and modify this project for personal or educational purposes, but not to create a commercial product or sell it.
