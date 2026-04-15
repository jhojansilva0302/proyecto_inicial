# Sistema de Gestión de Tareas

Este proyecto es una aplicación fullstack para la gestión de tareas y administración de usuarios (administradores). Consiste en un backend en Node.js/Express y un frontend desarrollado en Angular.

## Arquitectura del Proyecto

El proyecto está dividido en dos directorios principales:

- `frontend/`: Aplicación principal en Angular que contiene la interfaz de usuario.
- `backend/`: API RESTful en Node.js que maneja la lógica de negocio y la conexión a la base de datos.
- **Base de Datos**: MySQL.

## Características

- Autenticación y Autorización de Usuarios.
- Gestión de Tareas (CRUD de tareas).
- Panel de Administración para gestionar administradores del sistema (listar, crear, eliminar).
- Entornos separados para desarrollo y producción.

## Requisitos Previos

Asegúrate de tener instalados los siguientes componentes:

- [Node.js](https://nodejs.org/) (Versión recomendada LTS)
- [Angular CLI](https://angular.io/cli) 
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)

## Configuración y Ejecución

### Backend (Node.js)

1. Ve al directorio del backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno. Copia el archivo `.env.example` a `.env` y configura tus credenciales de MySQL y detalles locales.
   ```bash
   cp .env.example .env
   ```
4. Inicia el servidor en modo desarrollo (usa `nodemon` para reinicio automático):
   ```bash
   npm run dev
   ```

### Frontend (Angular)

1. Abre una nueva terminal y ve al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo de Angular:
   ```bash
   npm start
   ```
   *La aplicación estará disponible en `http://localhost:4200`.*

## Modos de Despliegue (Producción)

El proyecto cuenta con las configuraciones listas para producción:
- **Frontend**: Suelen desplegarse plataformas como Vercel y se configuran sus variables en `environments/environment.ts`.
- **Backend**: Despliegue listo para servicios como Railway conectándose a la base de datos de producción mediante variables de entorno configuradas directamente en el hosting.

---
*Este documento ha sido generado para resumir el estado y las instrucciones principales del repositorio actual.*
