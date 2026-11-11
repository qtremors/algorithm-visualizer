.PHONY: setup dev check audit export serve
setup:
	uv sync --project backend --frozen
	npm --prefix frontend ci

dev:
	python scripts/dev.py

check:
	uv run --project backend ruff check backend scripts
	uv run --project backend pytest backend/tests --cov=app --cov-fail-under=85
	npm --prefix frontend run lint
	npm --prefix frontend test -- --run
	npm --prefix frontend run build
	python scripts/check_requirements.py

audit:
	npm --prefix frontend audit --audit-level=moderate
	uv run --project backend pip-audit -r backend/requirements.txt

export:
	uv export --project backend --frozen --no-dev --no-hashes --no-emit-project --output-file backend/requirements.txt
	cp backend/requirements.txt requirements.txt

serve:
	uv run --project backend python scripts/serve.py
