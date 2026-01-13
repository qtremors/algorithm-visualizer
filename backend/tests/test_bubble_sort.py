import pytest
import sys
import os

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.algorithms.sorting.bubble_sort import BubbleSort

def test_bubble_sort_sorting():
    data = [4, 2, 7, 1, 3]
    algo = BubbleSort(data)
    
    steps = list(algo.run())
    
    # Final step should be type 'sorted'
    assert steps[-1]["type"] == "sorted"
    assert steps[-1]["snapshot"] == [1, 2, 3, 4, 7]

def test_bubble_sort_validation():
    with pytest.raises(ValueError):
        BubbleSort("not a list")
    
    with pytest.raises(ValueError):
        BubbleSort([1, "a", 3])
