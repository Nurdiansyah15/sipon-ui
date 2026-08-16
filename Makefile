.PHONY: help up down logs restart install build preview exec lint test

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  sipon-ui — perintah yang tersedia:"
	@echo ""
	@echo "  Development:"
	@echo "    make up            Jalankan dev server (hot reload) di container"
	@echo "    make down          Hentikan container dev"
	@echo "    make logs          Lihat log dev server (follow)"
	@echo "    make restart       Restart container dev"
	@echo "    make install       Install dependency di dalam container"
	@echo "    make build         Build production di dalam container"
	@echo "    make preview       Preview hasil build"
	@echo "    make exec          Masuk ke shell container"
	@echo ""

# ── Development ───────────────────────────────────────────────────────────────
up:
	docker compose -f docker-compose.dev.yml up -d
	@echo "sipon-ui berjalan di http://localhost:$${UI_EXPOSE_PORT:-3000}"

down:
	docker compose -f docker-compose.dev.yml down

logs:
	docker compose -f docker-compose.dev.yml logs -f ui

restart:
	docker compose -f docker-compose.dev.yml restart ui

install:
	docker compose -f docker-compose.dev.yml run --rm --no-deps ui npm install

build:
	docker compose -f docker-compose.dev.yml run --rm ui npm run build

preview:
	docker compose -f docker-compose.dev.yml run --rm -p ${UI_EXPOSE_PORT:-3000}:3000 ui npm run preview

exec:
	docker compose -f docker-compose.dev.yml exec ui sh
