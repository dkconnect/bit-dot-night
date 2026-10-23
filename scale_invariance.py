
import numpy as np
from operators import apply_operator

OPERATORS = [
    "AND",
    "OR",
    "XOR",
    "ADD",
    "MULTIPLY",
    "HYBRID",
]

SIZE = 256

coordinates = np.arange(SIZE, dtype=np.int32)

x, y = np.meshgrid(
    coordinates,
    coordinates,
    indexing="ij"
)

for operator in OPERATORS:

    original = apply_operator(x, y, operator)

    scaled_input = apply_operator(
        2 * x,
        2 * y,
        operator
    )

    scaled_output = np.multiply(
        original,
        2,
        dtype=np.int32
    )

    matches = scaled_input == scaled_output

    ratio = np.mean(matches)

    print(
        f"{operator:10s} | "
        f"Scale invariance: {ratio:.6f}"
    )