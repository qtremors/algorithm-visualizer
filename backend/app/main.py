
import json
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

# --- FastAPI App Instance ---
# Note: Renamed from 'app' to 'api' to avoid shadowing the 'app' package
# which caused "AttributeError: module 'app' has no attribute 'get'"
api = FastAPI()

# --- CORS Middleware ---
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allow_origins = allowed_origins_env.split(",") if allowed_origins_env != "*" else ["*"]

api.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.registry import registry

# --- Algorithm Discovery ---
# We import the algorithms to trigger their registrations.
# We use absolute imports here to ensure they are loaded correctly.
import app.algorithms.sorting.bubble_sort
import app.algorithms.sorting.selection_sort
import app.algorithms.sorting.insertion_sort
import app.algorithms.pathfinding.dijkstra
import app.algorithms.pathfinding.bfs
import app.algorithms.pathfinding.dfs

# --- API Route ---
@api.get("/api/algorithms")
async def get_algorithms_api():
    """
    Returns metadata for all available algorithms.
    """
    response = {}
    registered_algos = registry.get_algorithms()
    for category, algos in registered_algos.items():
        response[category] = {}
        for name, AlgorithmClass in algos.items():
            response[category][name] = getattr(AlgorithmClass, 'metadata', {})
    return response

# --- WebSocket Route ---
@api.websocket("/ws/visualize/{category}/{algorithm_name}")
async def websocket_endpoint(websocket: WebSocket, category: str, algorithm_name: str):

    await websocket.accept()
    
    AlgorithmClass = registry.get_algorithm(category, algorithm_name)
    if not AlgorithmClass:
        await websocket.close(code=1008, reason="Algorithm not found")
        return

    try:
        data_str = await websocket.receive_text()
        initial_data: Any = json.loads(data_str)
        algorithm_instance = AlgorithmClass(initial_data)
        
        for step in algorithm_instance.run():
            await websocket.send_json(step)
            
    except WebSocketDisconnect:
        print(f"Client disconnected.")
    except ValueError as e:
        print(f"Data validation error: {e}")
        await websocket.close(code=1003, reason=f"Invalid input data: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
        await websocket.close(code=1011, reason=f"An error occurred: {e}")
    finally:
        if websocket.client_state != "DISCONNECTED":
            await websocket.close()
            print("Visualization finished, connection closed.")