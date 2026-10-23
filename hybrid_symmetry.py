
import numpy as np
from operators import apply_operator

SIZE = 256

coordinates = np.arange(SIZE, dtype=np.int32)

x, y = np.meshgrid(
    coordinates,
    coordinates,
    indexing="ij"
)

original = apply_operator(x, y, "HYBRID")
swapped = apply_operator(y, x, "HYBRID")

symmetric = original == swapped

positions = np.argwhere(symmetric)

print("Total symmetric pairs:", len(positions))
print("Expected diagonal pairs:", SIZE)

off_diagonal = positions[
    positions[:, 0] != positions[:, 1]
]

print("Off-diagonal symmetric pairs:", len(off_diagonal))

print("\nFirst 20 symmetric coordinates:")
print(positions[:20])
