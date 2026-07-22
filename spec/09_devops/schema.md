# 09 — DevOps Schema

> No database schema required for DevOps layer.
> DevOps is infrastructure-only (Nginx/Traefik, monitoring, container orchestration).

## Infrastructure Components

| Component | Configuration | Data Store |
|-----------|--------------|------------|
| **Nginx** | `nginx.conf` — reverse proxy, TLS, rate limiting, security headers | File-based config |
| **Traefik** | `traefik.yml` + Docker labels (alternative to Nginx) | File-based / Docker labels |
| **Prometheus** | `prometheus.yml` — scrape config, alert rules | TSDB (on-disk) |
| **Grafana** | `datasources.yml`, `dashboards/` | SQLite / MySQL (metadata) |
| **Loki** | `loki-config.yml` | Object store (filesystem/S3) |
| **Promtail** | `promtail-config.yml` — log shipping | — |
| **Docker Compose** | `docker-compose.yml` — service definitions | — |

## Key Config Patterns

### Nginx Rate Limit Zones

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/m;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

### Prometheus Scrape Config

```yaml
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']
  - job_name: 'mysql'
    static_configs:
      - targets: ['mysqld-exporter:9104']
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']
```

### Loki Log Labels

```
{compose_service="backend", level="error"}
{compose_service="nginx", method="POST", status="5xx"}
```

## Data Retention

| Data | Retention | Storage |
|------|-----------|---------|
| Prometheus metrics | 15 days (default) | Local volume |
| Loki logs | 30 days | Local volume / S3 |
| Nginx access logs | 90 days (logrotate) | Host filesystem |
| Grafana dashboards | Indefinite | SQLite / config files |
