import numpy as np

class BitOperators:
    @staticmethod
    def bitwise_rotation_left(val: np.ndarray, shift: int, width: int = 8) -> np.ndarray:
        shift = shift % width
        return ((val << shift) | (val >> (width - shift))) & ((1 << width) - 1)

    @staticmethod
    def bitwise_rotation_right(val: np.ndarray, shift: int, width: int = 8) -> np.ndarray:
        shift = shift % width
        return ((val >> shift) | (val << (width - shift))) & ((1 << width) - 1)

    @staticmethod
    def apply_neighborhood_xor(grid: np.ndarray) -> np.ndarray:
        up = np.roll(grid, shift=-1, axis=0)
        down = np.roll(grid, shift=1, axis=0)
        left = np.roll(grid, shift=-1, axis=1)
        right = np.roll(grid, shift=1, axis=1)
        
        # Combine neighbors using bitwise XOR operations
        return grid ^ up ^ down ^ left ^ right

    @staticmethod
    def matrix_to_bit_array(matrix: np.ndarray) -> np.ndarray:
        return np.packbits(matrix.astype(np.uint8))