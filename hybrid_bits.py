
from operators import apply_operator

BIT_WIDTH = 32

def trailing_zeros(value):
    value = int(value) & 0xFFFFFFFF

    if value == 0:
        return BIT_WIDTH

    count = 0

    while (value & 1) == 0:
        count += 1
        value >>= 1

    return count


print("HYBRID binary structure\n")

for x in range(1, 9):
    for y in range(1, 9):

        result = int(
            apply_operator(x, y, "HYBRID")
        )

        zeros = trailing_zeros(result)

        print(
            f"x={x:2d}, y={y:2d} | "
            f"H={result:4d} | "
            f"Trailing zeros={zeros}"
        )

    print()
