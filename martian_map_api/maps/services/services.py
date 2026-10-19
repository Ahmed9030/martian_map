import time
import numpy as np
import pandas as pd
import rasterio

from scipy.ndimage import gaussian_filter
from skimage.graph import route_through_array
from django.conf import settings


def getLeastCostRoute(startX, startY, endX, endY, tifMap, tifTherm):
    start_time = time.time()

    # Coordinates are pixel indices: (row, column)
    start_node = (int(startX), int(startY))
    end_node = (int(endX), int(endY))

    tifMap_path = settings.TIF_PATH / tifMap
    tifTherm_path = settings.TIF_PATH / tifTherm
    with rasterio.open(tifTherm_path) as src:
        therm = src.read(1).astype(np.float64)
    with rasterio.open(tifMap_path) as src:
        elevation = src.read(1).astype(np.float64)
        transform = src.transform
        crs = src.crs
        nodata = src.nodata
        valid_mask = src.read_masks(1) > 0

    height, width = elevation.shape

    # Validate start and end pixels.
    for name, (row, col) in [
        ("Start", start_node),
        ("End", end_node),
    ]:
        if not (0 <= row < height and 0 <= col < width):
            raise ValueError(
                f"{name} pixel {(row, col)} is outside the raster."
            )

    # Exclude masked, non-finite and NoData cells.
    valid_data = valid_mask & np.isfinite(elevation)

    if nodata is not None:
        if np.isnan(nodata):
            valid_data &= ~np.isnan(elevation)
        else:
            valid_data &= elevation != nodata

    if not valid_data.any():
        raise ValueError("No valid elevation data found in the TIF.")

    # Fill missing cells for gradient calculation only.
    elevation_clean = elevation.copy()
    elevation_clean[~valid_data] = np.nan

    filled = (
        pd.DataFrame(elevation_clean)
        .interpolate(axis=0, limit_direction="both")
        .interpolate(axis=1, limit_direction="both")
        .to_numpy()
    )

    remaining = ~np.isfinite(filled)
    if remaining.any():
        filled[remaining] = np.nanmean(elevation_clean)

    # Smooth the elevation surface.
    smoothed = gaussian_filter(filled, sigma=1.0)

    # Pixel dimensions in coordinate units.
    pixel_width = float(np.hypot(transform.a, transform.d))
    pixel_height = float(np.hypot(transform.b, transform.e))

    if pixel_width <= 0 or pixel_height <= 0:
        raise ValueError("Invalid raster resolution.")

    if crs is None:
        raise ValueError(
            "The TIF has no CRS. Verify its coordinate reference system."
        )
    else:
        # convert it linear units to meters.
        try:
            _, meters_per_unit = crs.linear_units_factor
            meters_per_unit = float(meters_per_unit)
        except Exception as exc:
            raise ValueError(
                "Cannot determine the units. "
                "Check the metadata of the TIF."
            ) from exc

        if not np.isfinite(meters_per_unit) or meters_per_unit <= 0:
            raise ValueError("Invalid projected unit conversion.")

        dx_m = pixel_width * meters_per_unit
        dy_m = pixel_height * meters_per_unit

        dz_drow = np.gradient(smoothed, axis=0)
        dz_dcol = np.gradient(smoothed, axis=1)

        dz_dy = dz_drow / dy_m
        dz_dx = dz_dcol / dx_m


    slope_degrees = np.degrees(
        np.arctan(np.hypot(dz_dx, dz_dy))
    )

    # Terrain safety and cost.
    # Change this threshold to match your rover's capabilities.
    MAX_SAFE_SLOPE = 10.0
    SLOPE_PENALTY_WEIGHT = 100.0

    terrain_cost = 1.0 + SLOPE_PENALTY_WEIGHT * (
        np.clip(
            slope_degrees / MAX_SAFE_SLOPE,
            0.0,
            1.0,
        ) ** 2
    )

    traversable = (
        valid_data
        & np.isfinite(slope_degrees)
        & (slope_degrees <= MAX_SAFE_SLOPE)
    )

    if not traversable.any():
        raise ValueError(
            "No traversable terrain found. Check the file "
            "elevation units and slope threshold."
        )

    for name, node in [
        ("Start", start_node),
        ("End", end_node),
    ]:
        if not valid_data[node]:
            raise ValueError(
                f"{name} point has missing elevation at {node}."
            )

        if not traversable[node]:
            raise ValueError(
                f"{name} point exceeds the slope limit "
                f"of {MAX_SAFE_SLOPE} degrees."
            )

    # Find the least-cost route.
    max_cost = float(terrain_cost[traversable].max())
    blocked_cost = max(max_cost, 1.0) * 1e12

    cost_grid = np.where(
        traversable,
        terrain_cost,
        blocked_cost,
    )

    path, accumulated_cost = route_through_array(
        cost_grid,
        start_node,
        end_node,
        fully_connected=True,
        geometric=True,
    )

    path_rows = np.array([p[0] for p in path], dtype=int)
    path_cols = np.array([p[1] for p in path], dtype=int)

    if not np.all(traversable[path_rows, path_cols]):
        raise ValueError(
            "The computed route crosses blocked terrain."
        )
    path_temperatures = therm[path_rows, path_cols]
    path_slopes = slope_degrees[path_rows, path_cols]
    path_elevations = elevation[path_rows, path_cols]

    # Calculate route distance in meters.
    if len(path_rows) < 2:
        route_length_m = 0.0
    else:
        row_diff = np.diff(path_rows)
        col_diff = np.diff(path_cols)

        dx_path_m = col_diff * dx_m
        dy_path_m = row_diff * dy_m

        route_length_m = float(np.sum(np.hypot(dx_path_m, dy_path_m)))

    
    execution_time = time.time() - start_time

    print("=" * 45)
    print(f"Execution time: {execution_time:.3f} seconds")
    print(f"Accumulated cost: {accumulated_cost:.3f}")
    print(f"Route length: {route_length_m:.2f} m")
    print(f"Maximum route slope: {path_slopes.max():.2f} degrees")
    print("=" * 45)

    route_df = pd.DataFrame({
        "Step": range(1, len(path_rows) + 1),
        "X_pixel": path_rows,
        "Y_pixel": path_cols,
        "Elevation": path_elevations,
        "Slope_Degrees": path_slopes,
        "therm": path_temperatures
    })

    return {
        "path_data": route_df.to_dict(orient="records"),
        "route_length": round(route_length_m, 2),
        "Maximum_slope": round(float(path_slopes.max()), 2),
        "Minimum_slope": round(float(path_slopes.min()), 2),
        "execution_time": round(execution_time, 3),
        "accumulated_cost": round(float(accumulated_cost), 3),
        "max_safe_slope": MAX_SAFE_SLOPE,
    }