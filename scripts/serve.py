"""Production ASGI entry point with explicit trusted-proxy configuration."""

import os
import sys
from pathlib import Path

import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

if __name__ == "__main__":
    uvicorn.run(
        "app.main:api", host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")), ws_max_size=65536,
        proxy_headers=bool(os.getenv("FORWARDED_ALLOW_IPS")),
        forwarded_allow_ips=os.getenv("FORWARDED_ALLOW_IPS", "127.0.0.1"),
    )
