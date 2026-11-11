"""Bounded multiset BST/AVL model with immutable public tree snapshots."""

from dataclasses import dataclass
from app.base_algorithm import BaseAlgorithm
from app.registry import registry
from app.validation import MAX_SAFE_INTEGER


@dataclass
class Node:
    value: int
    count: int = 1
    left: "Node | None" = None
    right: "Node | None" = None
    height: int = 1


def height(node):
    return node.height if node else 0


def refresh(node):
    node.height = 1 + max(height(node.left), height(node.right))
    return node


class TreeModel:
    def __init__(self, balanced=False):
        self.root = None
        self.balanced = balanced
        self.rotations = []

    def rotate_left(self, node):
        root = node.right
        node.right = root.left
        root.left = refresh(node)
        self.rotations.append(f"left rotation at {node.value}")
        return refresh(root)

    def rotate_right(self, node):
        root = node.left
        node.left = root.right
        root.right = refresh(node)
        self.rotations.append(f"right rotation at {node.value}")
        return refresh(root)

    def balance(self, node):
        if node is None:
            return None
        refresh(node)
        if not self.balanced:
            return node
        difference = height(node.left) - height(node.right)
        if difference > 1:
            if height(node.left.left) < height(node.left.right):
                node.left = self.rotate_left(node.left)
            return self.rotate_right(node)
        if difference < -1:
            if height(node.right.right) < height(node.right.left):
                node.right = self.rotate_right(node.right)
            return self.rotate_left(node)
        return node

    def insert(self, node, value):
        if node is None:
            return Node(value)
        if value < node.value:
            node.left = self.insert(node.left, value)
        elif value > node.value:
            node.right = self.insert(node.right, value)
        else:
            node.count += 1
        return self.balance(node)

    def delete(self, node, value, entire=False):
        if node is None:
            return None
        if value < node.value:
            node.left = self.delete(node.left, value, entire)
        elif value > node.value:
            node.right = self.delete(node.right, value, entire)
        elif node.count > 1 and not entire:
            node.count -= 1
        elif node.left is None:
            return node.right
        elif node.right is None:
            return node.left
        else:
            successor = node.right
            while successor.left:
                successor = successor.left
            node.value, node.count = successor.value, successor.count
            node.right = self.delete(node.right, successor.value, entire=True)
        return self.balance(node)

    def search(self, value):
        node = self.root
        path = []
        while node:
            path.append(str(node.value))
            if value == node.value:
                return path, True
            node = node.left if value < node.value else node.right
        return path, False

    def traversal(self, order):
        result = []

        def visit(node):
            if not node:
                return
            if order == "preorder":
                result.append(node)
            visit(node.left)
            if order == "inorder":
                result.append(node)
            visit(node.right)
            if order == "postorder":
                result.append(node)

        visit(self.root)
        return result

    def snapshot(self, visited=None):
        return {"type": "tree", "root": str(self.root.value) if self.root else None,
                "nodes": [{"id": str(node.value), "value": node.value, "count": node.count,
                           "left": str(node.left.value) if node.left else None,
                           "right": str(node.right.value) if node.right else None,
                           "height": node.height} for node in self.traversal("preorder")],
                "visited": list(visited or [])}


def validate_tree(data):
    if not isinstance(data, dict) or data.get("kind") != "tree":
        raise ValueError("Tree input must have kind tree.")
    values, operations = data.get("values"), data.get("operations", [])
    if not isinstance(values, list) or len(values) > 40 or not isinstance(operations, list) or len(operations) > 40:
        raise ValueError("Use at most 40 initial values and 40 operations.")
    def valid(value):
        return type(value) is int and abs(value) <= MAX_SAFE_INTEGER
    if not all(valid(value) for value in values):
        raise ValueError("Tree values must be safe integers.")
    ids = set(values)
    for operation in operations:
        if not isinstance(operation, dict) or operation.get("type") not in ("insert", "delete", "search") or not valid(operation.get("value")):
            raise ValueError("Each tree operation needs insert, delete, or search and a safe integer value.")
        if operation["type"] == "insert":
            ids.add(operation["value"])
    if len(ids) > 50:
        raise ValueError("Use at most 50 distinct tree values across the session.")
    order = data.get("traversal", "inorder")
    if order not in ("inorder", "preorder", "postorder"):
        raise ValueError("Choose inorder, preorder, or postorder traversal.")
    return {"values": values.copy(), "operations": [dict(op) for op in operations], "traversal": order}


TREE_CODE = [
    "procedure SearchTree(values, operations)",
    "  for each initial value: insert by binary search order",
    "  for each requested operation",
    "    compare value with current node; descend left or right",
    "    insert: create a leaf or increment its duplicate count",
    "    delete: decrement count or replace with inorder successor",
    "    search: report whether the value exists",
    "    AVL: update heights and rotate unbalanced ancestors",
    "  visit nodes in the selected traversal order",
    "  return tree",
]


class SearchTree(BaseAlgorithm):
    balanced = False

    def __init__(self, data):
        super().__init__(validate_tree(data))
        self.tree = TreeModel(self.balanced)

    def step(self, kind, message, line, node=None, visited=None):
        return {"type": kind, "message": message, "line": line,
                "payload": {"node": node} if node is not None else {},
                "snapshot": self.tree.snapshot(visited),
                "learning": {"explanation": "Duplicate keys share a node and increment its count. An edit and its balancing rotations complete together."}}

    def run(self):
        yield self.step("info", "Starting tree construction...", 1)
        operations = [{"type": "insert", "value": value} for value in self.data["values"]] + self.data["operations"]
        for operation in operations:
            value, kind = operation["value"], operation["type"]
            path, found = self.tree.search(value)
            for node in path:
                yield self.step("compare", f"Compare {value} with {node}", 4, node=node)
            self.tree.rotations = []
            if kind == "insert":
                self.tree.root = self.tree.insert(self.tree.root, value)
                line, message = 5, f"Inserted {value}"
            elif kind == "delete":
                self.tree.root = self.tree.delete(self.tree.root, value)
                line, message = 6, f"Deleted one {value}" if found else f"{value} was absent"
            else:
                yield self.step("info", f"{value} {'found' if found else 'not found'}", 7, node=str(value) if found else None, visited=path)
                continue
            if self.tree.rotations:
                message += "; " + "; ".join(self.tree.rotations)
                line = 8
            yield self.step("tree_update", message, line)
        visited = []
        for node in self.tree.traversal(self.data["traversal"]):
            visited.append(str(node.value))
            yield self.step("visit_node", f"{self.data['traversal']}: visit {node.value} (count {node.count})", 9, node=str(node.value), visited=visited)
        yield self.step("info", "Tree operations complete.", 10, visited=visited)


@registry.register("trees", "bst")
class BST(SearchTree):
    metadata = {
        "name": "Binary Search Tree", "input_type": "tree", "visualizer": "tree",
        "pseudocode": TREE_CODE,
        "description": "Insert, delete, search, and traverse a binary search tree. Duplicate values use counts.",
        "complexity": {"time": "O(h) per edit; O(n) traversal", "space": "O(n)", "worst": "O(n) per edit"},
        "pros": ["Preserves sorted-key order.", "Simple structure for ordered lookup."],
        "cons": ["Sorted insertions can create a chain.", "Snapshots add O(n) visualization work."],
    }


@registry.register("trees", "avl")
class AVL(SearchTree):
    balanced = True
    metadata = {
        **BST.metadata, "name": "AVL Tree",
        "description": "Maintain BST order and a height difference of at most one with balancing rotations after each edit.",
        "complexity": {"time": "O(log n) per edit; O(n) traversal", "space": "O(n)"},
        "pros": ["Logarithmic search and edits.", "Shows single and double rotations in operation summaries."],
        "cons": ["More bookkeeping than a BST.", "Snapshots add O(n) visualization work."],
    }
