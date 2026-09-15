FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV ADMIN_PORT=8080
ENV SIMULATE_AWS=true
ENV FRONTEND_DIST_PATH=/app/dist

COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

COPY --from=frontend-builder /app/frontend/dist ./dist

# set env vars

EXPOSE 80 8080

WORKDIR /app/backend
CMD ["node","src/server.js"]
