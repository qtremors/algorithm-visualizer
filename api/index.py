import os
import sys

# Ensure backend directory is in sys.path for algorithm discovery and modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the FastAPI application instance (Vercel looks for `app`)
from app.main import api as app
