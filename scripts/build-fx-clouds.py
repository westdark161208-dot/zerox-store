"""Bake neutral cloud lighting. Requires Python, NumPy, SciPy and Pillow."""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, zoom, shift

WIDTH, HEIGHT, DEPTH = 128, 104, 56
shape = (DEPTH, HEIGHT, WIDTH)
z, y, x = np.indices(shape, dtype=np.float32)
atlas = Image.new("RGBA", (WIDTH * 3, HEIGHT * 2))


def turbulence(rng, spacing):
    grid = rng.uniform(-1, 1, tuple(np.ceil(np.divide(shape, spacing)).astype(int) + 1))
    return zoom(grid, np.divide(shape, grid.shape), order=3).astype(np.float32)


def tile(seed, smoke):
    rng = np.random.default_rng(seed)
    field = np.full(shape, -2, dtype=np.float32)
    # Overlapping lobes at different depths self-shadow along the light ray.
    for index in range(14):
        u = index / 13
        cx = 23 + 81 * u + rng.uniform(-5, 5)
        cy = 57 - 16 * np.sin(np.pi * u) + rng.uniform(-8, 9)
        cz = rng.uniform(21, 33)
        radius = 12 + 11 * np.sin(np.pi * u) + rng.uniform(0, 4)
        if smoke:
            cy += 11 * np.sin(u * 6 + seed)
        distance = np.sqrt(((x-cx)/radius)**2 + ((y-cy)/(radius*(.72 if smoke else 1)))**2
                           + ((z-cz)/(radius*.80))**2)
        field = np.maximum(field, 1-distance)
    detail = .27*turbulence(rng, 17) + .14*turbulence(rng, 8) + .065*turbulence(rng, 4)
    if smoke:
        # Fold thin sheets through the density so the smoke separates into wisps.
        fold = np.sin(x*.061 + y*.135 + z*.044 + 4.9*turbulence(rng, 22))
        envelope = np.clip((field + .24 + detail)*1.3, 0, 1)
        density = envelope*(.08 + .87*np.exp(-fold**2/.085))
    else:
        density = np.clip((field + detail + .05)*1.6, 0, 1)
    # Density tapers before the texture border even for an unusually large lobe.
    edge = np.minimum.reduce([x, WIDTH-1-x, y, HEIGHT-1-y, z, DEPTH-1-z])
    density *= np.clip(edge/6, 0, 1)
    optical = np.zeros(shape, dtype=np.float32)
    for step in range(1, 12):
        optical += shift(density, (step*1.8, step*2.6, step*2), order=1,
                         mode="constant", prefilter=False)
    light = .16 + .83*np.exp(-optical*.40)
    alpha = 1-np.exp(-density*(.105 if smoke else .22))
    transmission = np.ones(shape[1:])
    radiance = np.zeros_like(transmission)
    for opacity, incident in zip(alpha, light):
        radiance += transmission*opacity*incident
        transmission *= 1-opacity
    opacity = 1-transmission
    shade = np.divide(radiance, opacity, out=np.zeros_like(radiance), where=opacity>.00001)
    if smoke:
        opacity = gaussian_filter(opacity, .7)*.85
    pixels = np.stack((shade, shade, shade, opacity), axis=2)
    return Image.fromarray(np.uint8(255*np.clip(pixels, 0, 1)))


for row in range(2):
    for column in range(3):
        atlas.paste(tile(157 + column + row*3, row == 1), (column*WIDTH, row*HEIGHT))
target = Path(__file__).resolve().parents[1]/"assets/fx/cloud-light-v1.png"
atlas.save(target, optimize=True)
