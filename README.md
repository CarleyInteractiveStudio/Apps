---
title: Creative Game Showcase
emoji: 🎮
colorFrom: blue
colorTo: green
sdk: docker
app_port: 3001
---

# Creative Game Showcase

Este Space contiene la aplicación full-stack para "Creative Game".

## ¿Qué hay dentro?

-   **Frontend**: Una aplicación de React (construida con Vite) que se encuentra en la carpeta `/frontend`. Muestra los juegos en una interfaz moderna.
-   **Backend**: Un servidor de Node.js con Express que se encuentra en la carpeta `/backend`. Proporciona la API `/api/games` para servir los datos de los juegos.

## ¿Cómo funciona?

El `Dockerfile` en la raíz del proyecto se encarga de:
1.  Construir la aplicación de React.
2.  Instalar las dependencias del servidor de Node.js.
3.  Servir el frontend estático en el puerto `3001`.
4.  Ejecutar el servidor de la API en el puerto `3000`.

El proxy de Vite en desarrollo se reemplaza por dos servicios que se ejecutan en producción. Las peticiones a la API desde el frontend están configuradas para ir directamente a la ruta relativa `/api/games`, que funcionará en este entorno.
