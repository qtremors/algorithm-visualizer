"""Check exported Python deployment dependencies against the lock."""

import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def dependencies(path):
    return [line.strip() for line in Path(path).read_text().splitlines()
            if line.strip() and not line.lstrip().startswith("#")]


def main():
    with tempfile.TemporaryDirectory() as folder:
        exported = Path(folder) / "requirements.txt"
        subprocess.run([
            "uv", "export", "--project", str(ROOT / "backend"), "--frozen",
            "--no-dev", "--no-hashes", "--no-emit-project",
            "--output-file", str(exported), "--quiet",
        ], check=True, capture_output=True)
        expected = dependencies(exported)
        for path in [ROOT / "requirements.txt", ROOT / "backend/requirements.txt"]:
            if dependencies(path) != expected:
                raise SystemExit(f"{path.relative_to(ROOT)} differs from backend/uv.lock")
    print("Deployment requirements match the lock.")


if __name__ == "__main__":
    main()
