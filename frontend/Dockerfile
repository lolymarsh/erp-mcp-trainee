# Multi-stage production build for Versus ERP Frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig*.json vite.config.ts ./
RUN npm ci

COPY index.html ./
COPY src ./src
COPY public ./public

RUN npm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ../docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
