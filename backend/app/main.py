import importlib
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend's domain
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
        },
        "insertion_sort": {
            "module_path": "app.algorithms.sorting.insertion_sort",
            "class_name": "InsertionSort"
        }
    },
    "pathfinding": {
        "dijkstra": {
            "module_path": "app.algorithms.pathfinding.dijkstra",
            "class_name": "Dijkstra"
        },
        "bfs": {
            "module_path": "app.algorithms.pathfinding.bfs",
            "class_name": "BFS"
        },
        "dfs": {
            "module_path": "app.algorithms.pathfinding.dfs",
            "class_name": "DFS"
        }
    }
}

# --- Helper Function ---
def get_algorithm_class(category: str, name: str) -> Any:
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
    """
    Returns metadata for all available algorithms.
    The frontend uses this to build its UI dynamically.
    """
    response = {}
    for category, algos in ALGORITHMS.items():
        response[category] = {}
        for name in algos:
            AlgorithmClass = get_algorithm_class(category, name)
            if AlgorithmClass:
                response[category][name] = getattr(AlgorithmClass, 'metadata', {})
    return response

# --- WebSocket Route ---
@app.websocket("/ws/visualize/{category}/{algorithm_name}")
async def websocket_endpoint(websocket: WebSocket, category: str, algorithm_name: str):

    await websocket.accept()
    
    AlgorithmClass = get_algorithm_class(category, algorithm_name)
    if not AlgorithmClass:
        await websocket.close(code=1008, reason="Algorithm not found")
        return

    try:
        # 1. Wait to receive the data from the client
        data_str = await websocket.receive_text()
        
        # 2. Input is generic (can be a list, dict, etc.)
        initial_data: Any = json.loads(data_str)

        # 3. Initialize the algorithm. The class itself handles validation.
        algorithm_instance = AlgorithmClass(initial_data)
        
        # 4. Run the algorithm and stream steps back to the client.
        for step in algorithm_instance.run():
            await websocket.send_json(step)
            
    except WebSocketDisconnect:
        print(f"Client disconnected.")
    except ValueError as e:
        # Handle data validation errors
        print(f"Data validation error: {e}")
        await websocket.close(code=1003, reason=f"Invalid input data: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
        await websocket.close(code=1011, reason=f"An error occurred: {e}")
    finally:
        if websocket.client_state != "DISCONNECTED":
            await websocket.close()
            print("Visualization finished, connection closed.")