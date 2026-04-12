"""
streaming_algorithms.py
Exact frequency count, Reservoir Sampling, Count-Min Sketch.
"""

import random
import math
import hashlib


def exact_frequency(stream: list) -> dict:
    """Exact frequency count – O(n) time, O(n) space."""
    freq = {}
    steps = []
    for i, item in enumerate(stream):
        freq[item] = freq.get(item, 0) + 1
        steps.append({
            "position": i,
            "item": item,
            "freq": dict(freq),
            "description": f"Item '{item}' → count={freq[item]}",
        })
    return {"frequencies": freq, "steps": steps}


def reservoir_sample(stream: list, k: int, seed: int = 42) -> dict:
    """
    Reservoir Sampling – uniform random sample of size k from stream.
    O(n) time, O(k) space.
    """
    rng = random.Random(seed)
    reservoir = []
    steps = []

    for i, item in enumerate(stream):
        if i < k:
            reservoir.append(item)
            steps.append({
                "position": i, "item": item,
                "reservoir": list(reservoir),
                "action": "fill",
                "description": f"Fill reservoir[{i}] = {item}",
            })
        else:
            j = rng.randint(0, i)
            if j < k:
                replaced = reservoir[j]
                reservoir[j] = item
                steps.append({
                    "position": i, "item": item,
                    "reservoir": list(reservoir),
                    "action": "replace",
                    "description": f"Replace reservoir[{j}] ({replaced}→{item}) with prob {k}/{i+1:.0f}",
                })
            else:
                steps.append({
                    "position": i, "item": item,
                    "reservoir": list(reservoir),
                    "action": "skip",
                    "description": f"Threw away {item} (j={j} ≥ k={k})",
                })

    return {"sample": reservoir, "steps": steps}


class CountMinSketch:
    """Count-Min Sketch – approximate frequency, O(wd) space."""

    def __init__(self, width: int = 20, depth: int = 3, seed: int = 42):
        self.width  = width
        self.depth  = depth
        self.table  = [[0] * width for _ in range(depth)]
        self.seeds  = [seed * (i + 1) for i in range(depth)]

    def _hash(self, item, row: int) -> int:
        val = hashlib.md5(f"{self.seeds[row]}{item}".encode()).hexdigest()
        return int(val, 16) % self.width

    def add(self, item) -> list:
        positions = []
        for d in range(self.depth):
            col = self._hash(item, d)
            self.table[d][col] += 1
            positions.append((d, col))
        return positions

    def query(self, item) -> int:
        return min(self.table[d][self._hash(item, d)] for d in range(self.depth))


def count_min_sketch_stream(stream: list, width: int = 20, depth: int = 3) -> dict:
    """Run Count-Min Sketch over stream and return steps."""
    cms = CountMinSketch(width=width, depth=depth)
    steps = []

    for i, item in enumerate(stream):
        positions = cms.add(item)
        approx    = cms.query(item)
        steps.append({
            "position": i, "item": item,
            "positions": positions,
            "approx_count": approx,
            "description": f"Item '{item}' → approx count ≈ {approx}",
        })

    # Final approximate frequencies for all unique items
    unique = list(set(stream))
    approx_freq = {it: cms.query(it) for it in unique}
    return {"approx_frequencies": approx_freq, "sketch_table": cms.table, "steps": steps}
