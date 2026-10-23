
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

def test_symmetry(operator, size=256):
    coordinates = np.arange(size, dtype=np.int32)

    x, y = np.meshgrid(
        coordinates,
        coordinates,
        indexing="ij"
    )

    original = apply_operator(x, y, operator)
    swapped = apply_operator(y, x, operator)

    equal = original == swapped

    symmetry_ratio = np.mean(equal)

    return symmetry_ratio


if __name__ == "__main__":
    for operator in OPERATORS:
        ratio = test_symmetry(operator)

        print(
            f"{operator:10s} | "
            f"Symmetry: {ratio:.4f}"
        )
