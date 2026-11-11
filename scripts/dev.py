"""Run both development services and stop their child processes together."""

import os
import signal
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    processes = []
    try:
        processes.append(subprocess.Popen([
            "uv", "run", "--frozen", "--project", "backend", "uvicorn", "app.main:api",
            "--app-dir", "backend", "--reload", "--ws-max-size", "65536",
        ], cwd=ROOT, start_new_session=True))
        processes.append(subprocess.Popen(["npm", "run", "dev"], cwd=ROOT / "frontend", start_new_session=True))
        while all(process.poll() is None for process in processes):
            time.sleep(0.25)
        return next((process.returncode for process in processes if process.returncode), 0)
    except KeyboardInterrupt:
        return 0
    finally:
        for process in processes:
            if process.poll() is None:
                os.killpg(process.pid, signal.SIGTERM)
        for process in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)


if __name__ == "__main__":
    raise SystemExit(main())
