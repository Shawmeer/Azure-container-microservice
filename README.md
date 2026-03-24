# Full-Stack Microservices (Azure-ready containers)

This repository is a simple full-stack microservices app designed to be deployed on Azure using containers (Azure Container Apps or Azure App Service).

## Architecture
- `user-service` (Node.js + Express): `GET /users`
- `product-service` (Node.js + Express): `GET /products`
- `api-gateway` (Node.js + Express, optional): `GET /api/users`, `GET /api/products`
- `frontend` (React + Vite): calls the gateway and displays users + products

All services are containerized and listen on `0.0.0.0` so they work correctly in Docker.

## Run locally
1. Build and start everything:
   ```bash
   docker-compose up --build
   ```
2. Open:
   - Frontend: http://localhost:3000
     - If port `3000` is already in use, use `http://localhost:3005` (docker-compose maps the frontend container to `3005`).

## Build Docker images
```bash
docker-compose build
```

## Environment variables (examples)
- See `./.env.example`
- Each service also includes an `.env.example` file in its folder.

## Deployment notes (Azure readiness)
- Each container reads `PORT` (and falls back to `WEBSITES_PORT` when applicable).
- The gateway uses service-name URLs (e.g. `http://user-service:3001`) so containers can communicate without `localhost`.

