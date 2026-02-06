export const SHAPES = {
    // 1x1
    SINGLE: [[1]],

    // 1x2, 1x3, 1x4, 1x5
    I2: [[1, 1]],
    I2_V: [[1], [1]],
    I3: [[1, 1, 1]],
    I3_V: [[1], [1], [1]],
    I4: [[1, 1, 1, 1]],
    I4_V: [[1], [1], [1], [1]],
    I5: [[1, 1, 1, 1, 1]],
    I5_V: [[1], [1], [1], [1], [1]],

    // 2x2
    O: [[1, 1],
    [1, 1]],

    // 3x3 (Big Block)
    O3: [[1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]],

    // L Shapes (2x2 bounding box for small L, 3x2 for large L)
    L2: [[1, 0],
    [1, 1]], // Small L
    L2_R0: [[1, 1],
    [1, 0]],
    L2_R1: [[1, 1],
    [0, 1]],
    L2_R2: [[0, 1],
    [1, 1]],

    // L3 (True L)
    L3: [[1, 0],
    [1, 0],
    [1, 1]],
    L3_90: [[1, 1, 1],
    [1, 0, 0]],
    L3_180: [[1, 1],
    [0, 1],
    [0, 1]],
    L3_270: [[0, 0, 1],
    [1, 1, 1]],

    // J3 (Mirrored L)
    J3: [[0, 1],
    [0, 1],
    [1, 1]],
    J3_90: [[1, 0, 0],
    [1, 1, 1]],
    // ... Simplified list for MVP. We can add more.

    // T Shapes
    T: [[1, 1, 1],
    [0, 1, 0]],
    T_90: [[0, 1],
    [1, 1],
    [0, 1]],
    T_180: [[0, 1, 0],
    [1, 1, 1]],
    T_270: [[1, 0],
    [1, 1],
    [1, 0]],
};

export const getRandomShape = () => {
    const keys = Object.keys(SHAPES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { name: key, shape: SHAPES[key] };
};
