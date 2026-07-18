# Phase 09 — DevOps & Production Architecture

> **Priority**: 🟢 Low (study only — ไม่มี deploy จริง)
> **Estimate**: 1 day (อ่าน + เข้าใจ architecture)
> **Status**: Planning/Reference — สำหรับเรียนรู้วิธีการทำ DevOps

---

## DevOps Philosophy

**App server ควรบางที่สุด** — ทำแค่ business logic อย่างเดียว หน้าที่อื่นยกให้ DevOps layer:

```
สิ่งที่ App Server ทำ:
  ✅ CORS (allow all — DevOps จะ filter ที่ reverse proxy)
  ✅ JSON body parsing (Express 5 built-in)
  ✅ Health check endpoint
  ✅ Business routes

สิ่งที่ DevOps Layer ทำ:
  ✅ Rate Limiting
  ✅ CORS (actual restriction — filter allowed origins)
  ✅ Security Headers (Content-Security-Policy, X-Frame-Options, etc.)
  ✅ HTTPS/TLS Termination
  ✅ Static File Serving (frontend build)
  ✅ Compression (gzip/brotli)
  ✅ Request Logging / Access Logs
  ✅ IP Filtering / WAF
  ✅ Load Balancing (ถ้ามีหลาย instance)
```

## Architecture — Full Stack with DevOps

```
                          Internet
                             │
                    ┌────────▼────────┐
                    │   Cloudflare     │ (optional: DNS, CDN, DDoS protection)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Traefik/Nginx   │ ← Reverse Proxy (DevOps Layer)
                    │  Port 80/443     │
                    │                  │
                    │  • HTTPS (TLS)   │
                    │  • Rate Limiting │
                    │  • CORS (strict) │
                    │  • Security Hdrs │
                    │  • Compression   │
                    │  • Static Files  │
                    │  • Access Logs   │
                    └───┬──────────┬───┘
                        │          │
              ┌─────────▼──┐  ┌───▼──────────┐
              │ Frontend   │  │  Backend      │
              │ (static)   │  │  :3000        │
              │ /          │  │  /api/*       │
              └────────────┘  └───┬──────┬────┘
                                  │      │
                    ┌─────────────▼┐ ┌───▼──────────┐
                    │   MySQL 8.4  │ │  Redis 7      │
                    │   MongoDB 7  │ │  RabbitMQ 3.13│
                    └──────────────┘ └───────────────┘
```

## Nginx Reverse Proxy Config (ตัวอย่าง)

```nginx
# nginx.conf — Versus Thailand ERP
upstream backend {
    server backend:3000;
}

server {
    listen 443 ssl http2;
    server_name erp.versus-thailand.local;

    # === TLS ===
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # === Security Headers (แทน helmet ใน Express) ===
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # === Rate Limiting ===
    limit_req_zone $binary_remote_addr zone=api:10m rate=20r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # === Compression ===
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # === Frontend (static files) ===
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # === Backend API ===
    location /api/ {
        # Rate limit — general API
        limit_req zone=api burst=10 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # === Auth endpoints — stricter rate limit ===
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # === Health check (no rate limit) ===
    location /health {
        proxy_pass http://backend;
        access_log off;
    }
}
```

## CORS Strategy — Two Layers

```
App Server (Express):
  cors({ origin: '*' })      ← allow all (ง่าย, dev-friendly)

DevOps (Nginx/Traefik):
  filter origin by config    ← allow only erp.versus-thailand.com, localhost
  return 403 if not allowed  ← block ก่อนถึง app server
```

**Why**: ถ้าเปลี่ยน CORS config → แก้ที่ Nginx config ไม่ต้อง restart app server

## What Leaves App Server

| Feature | Express (before) | Moved To | Reason |
|---------|-----------------|----------|--------|
| Rate Limiting | `shared/middleware/rateLimit.ts` | **Nginx** | เร็วกว่า, block ก่อนเข้า app, config โดย DevOps |
| Security Headers | `helmet()` | **Nginx** | ทำครั้งเดียวทั้ง frontend+backend |
| CORS (restriction) | `cors({ origin: [...] })` | **Nginx** | App server allow all, DevOps filter |
| Static Files | — | **Nginx** | เร็วกว่า Express มาก |
| Compression | — | **Nginx** | gzip/brotli ที่ reverse proxy |
| TLS/HTTPS | — | **Nginx/Traefik** | Reverse proxy handles certs |
| Access Logs | — | **Nginx** | Standard format, log rotation |

## What Stays in App Server

| Feature | File | Reason |
|---------|------|--------|
| CORS (allow all) | `app.ts` | `cors({ origin: '*' })` — dev safety net |
| JSON Parsing | `app.ts` | Express 5 built-in `express.json()` |
| Helmet (basic) | `app.ts` | Fallback if no reverse proxy in dev |
| Health Check | `app.ts` | `/health` → load balancer / docker healthcheck |
| JWT Auth | `middleware/auth.ts` | Business logic — app responsibility |
| Zod Validation | `middleware/validator.ts` | Business logic |

## Local Dev vs Production

```
Local Dev (docker compose):
  browser → Express:3000 (direct, no reverse proxy)
  CORS: allow all
  Rate limit: none (dev convenience)

Production (docker compose + nginx):
  browser → Nginx:443 → Express:3000
  CORS: Nginx filters
  Rate limit: Nginx enforces
  TLS: Nginx handles
  helmet: can be disabled in Express (nginx does it)
```

## Docker Compose — Add Nginx (Production)

```yaml
# Add to docker-compose.yml (production only)
nginx:
  image: nginx:alpine
  container_name: versus_nginx
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/certs:/etc/nginx/certs:ro
    - ./frontend/dist:/usr/share/nginx/html:ro
  depends_on:
    - backend
  networks:
    - versus_net
```

## DevOps Checklist (When Ready)

```
[ ] Nginx reverse proxy config
[ ] TLS certificates (self-signed for dev, Let's Encrypt for prod)
[ ] Security headers configured
[ ] Rate limiting zones defined
[ ] CORS origin whitelist
[ ] Static file serving (frontend build)
[ ] Gzip compression enabled
[ ] Access log format + rotation
[ ] Health check endpoints configured
[ ] Docker healthcheck for all services
[ ] Backup script (mysqldump + s3)
[ ] Monitoring (prometheus? grafana?)
```

---

> **Note**: Phase 09 เป็น reference สำหรับเรียนรู้ — ไม่ต้อง implement จริงในโปรเจกต์ study นี้
> ใช้ `docker compose up -d` รัน backend โดยตรงที่ port 3000 ก็พอ
