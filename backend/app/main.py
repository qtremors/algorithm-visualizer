import asyncio
import importlib
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List

# --- App Initialization ---
app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Algorithm Registry ---
ALGORITHMS: Dict[str, Any] = {
    "sorting": {
        "bubble_sort": {
            "module_path": "app.algorithms.sorting.bubble_sort",
            "class_name": "BubbleSort"
        },
        "selection_sort": {
            "module_path": "app.algorithms.sorting.selection_sort",
            "class_name": "SelectionSort"
        }
    }
}

# --- Helper Function ---
def get_algorithm_class(category: str, name: str):
    """Dynamically imports and returns an algorithm class from the registry."""
    try:
        algo_info = ALGORITHMS[category][name]
        module = importlib.import_module(algo_info["module_path"])
        return getattr(module, algo_info["class_name"])
    except (KeyError, ImportError, AttributeError) as e:
        print(f"Error loading algorithm '{category}/{name}': {e}")
        return None

# --- API Route ---
@app.get("/api/algorithms")
async def get_algorithms_api():
    """Returns metadata for all available algorithms."""
    response = {}
    for category, algos in ALGORITHMS.items():
        response[category] = {}
        for name in algos:
            AlgorithmClass = get_algorithm_class(category, name)
            if AlgorithmClass:
                instance = AlgorithmClass([])
                response[category][name] = {
                    "name": getattr(instance, 'name', 'N/A'),
                    "pseudocode": getattr(instance, 'pseudocode', [])
                }
    return response

# --- WebSocket Route ---
@app.websocket("/ws/visualize/{category}/{algorithm_name}")
async def websocket_endpoint(websocket: WebSocket, category: str, algorithm_name: str):
    """
    Handles the real-time WebSocket connection. Waits for the user-defined array
    from the client, then runs the algorithm and streams the steps.
    """
    await websocket.accept()
    
    AlgorithmClass = get_algorithm_class(category, algorithm_name)
    if not AlgorithmClass:
        await websocket.close(code=1008, reason="Algorithm not found")
        return

    try:
        # **MODIFICATION**: Wait to receive the data array from the client first.
        data_str = await websocket.receive_text()
        initial_data: List[int] = json.loads(data_str)

        # Initialize the algorithm with the user-provided data
        algorithm_instance = AlgorithmClass(initial_data)
        
        # Run the algorithm and stream steps back to the client
        for step in algorithm_instance.run():
            await websocket.send_json(step)
            await asyncio.sleep(0.01)
            
    except WebSocketDisconnect:
        print(f"Client disconnected.")
    except Exception as e:
        print(f"An error occurred during visualization: {e}")
        await websocket.close(code=1011, reason=f"An error occurred: {e}")
    finally:
        if websocket.client_state != "DISCONNECTED":
            await websocket.close()
            print("Visualization finished, connection closed.")
