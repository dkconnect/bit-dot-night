
import numpy as np
from operators import apply_operator

pairs = [
    (0, 0),
    (5, 5),
    (0, 1),
    (0, -(2**31)),
    (-(2**31), 0),
    (2**31 - 1, -1),
]

print("HYBRID symmetry exceptions\n")

for x, y in pairs:
    forward = apply_operator(x, y, "HYBRID").item()
    reverse = apply_operator(y, x, "HYBRID").item()

    symmetric = forward == reverse

    print(
        f"x={x:12d}, y={y:12d} | "
        f"Symmetric={symmetric}"
    )
