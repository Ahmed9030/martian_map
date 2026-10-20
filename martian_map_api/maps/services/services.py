import time
import numpy as np
import pandas as pd
import rasterio

from rasterio.transform import xy
from scipy.ndimage import gaussian_filter
from skimage.graph import route_through_array
from django.conf import settings

def normalize_map(arr, valid_mask=None):
    if valid_mask is None:
        valid = np.isfinite(arr)
    else:
        valid = valid_mask & np.isfinite(arr)

    if not valid.any():
        return np.zeros(arr.shape, dtype=np.float64)

    min_v = np.min(arr[valid])
    max_v = np.max(arr[valid])

    result = np.zeros(arr.shape, dtype=np.float64)

    if max_v == min_v:
        result[valid] = 0.5
        return result

    result[valid] = np.clip(
        (arr[valid] - min_v) / (max_v - min_v),
        0.0,
        1.0,
    )

    return result


def getResourceRichRoute(coordinates, tifFiles, safelimites, resource_weights=None):

    weights = resource_weights or {
        'h2o': 0.8,
        'fe': 0.6,
        'si': 0.6
    }

    startX = float(coordinates['startX'])
    startY = float(coordinates['startY'])
    endX = float(coordinates['endX'])
    endY = float(coordinates['endY'])
    
    tifMap_path = getTifFile(tifFiles['elevation'])
    tifTherm_path = getTifFile(tifFiles['thermal'])
    tifH2O_path = getTifFile(tifFiles['H2O'])
    tifRad_path = getTifFile(tifFiles['rad'])
    tifWind_path = getTifFile(tifFiles['wind'])
    tifSi_path = getTifFile(tifFiles['si'])
    tifFe_path = getTifFile(tifFiles['fe'])

    with rasterio.open(tifWind_path) as src:
        wind = src.read(1).astype(np.float64)

    with rasterio.open(tifTherm_path) as src:
        therm = src.read(1).astype(np.float64)

    with rasterio.open(tifRad_path) as src:
        rad = src.read(1).astype(np.float64)

    with rasterio.open(tifH2O_path) as src:
        H2O = src.read(1).astype(np.float64)

    with rasterio.open(tifSi_path) as src:
        si = src.read(1).astype(np.float64)

    with rasterio.open(tifFe_path) as src:
        fe = src.read(1).astype(np.float64)

    with rasterio.open(tifMap_path) as src:
        elevation = src.read(1).astype(np.float64)
        transform = src.transform
        crs = src.crs
        nodata = src.nodata
        valid_mask = src.read_masks(1) > 0
        start_row, start_col = src.index(startX, startY)
        end_row, end_col = src.index(endX, endY)

    norm_h2o = normalize_map(H2O,valid_mask)
    norm_fe = normalize_map(fe,valid_mask)
    norm_si = normalize_map(si,valid_mask)

    combined_resource_score = (
        weights['h2o'] * norm_h2o +
        weights['fe']  * norm_fe  +
        weights['si']  * norm_si
    )

    RESOURCE_WEIGHT = 100.0
    resource_cost = RESOURCE_WEIGHT * ((1.0 - combined_resource_score) ** 2)

    start_time = time.time()

    # Coordinates are coordinate indices: (row, column)
    start_node = (start_row, start_col)
    end_node = (end_row, end_col)

    height, width = elevation.shape

    # Validate start and end coordinates.
    for name, (row, col) in [
        ("Start", start_node),
        ("End", end_node),
    ]:
        if not (0 <= row < height and 0 <= col < width):
            raise ValueError(
                f"{name} coordinate {(row, col)} is outside the raster."
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

    # coordinate dimensions in coordinate units.
    coordinate_width = float(np.hypot(transform.a, transform.d))
    coordinate_height = float(np.hypot(transform.b, transform.e))

    if coordinate_width <= 0 or coordinate_height <= 0:
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

        dx_m = coordinate_width * meters_per_unit
        dy_m = coordinate_height * meters_per_unit

        dz_drow = np.gradient(smoothed, axis=0)
        dz_dcol = np.gradient(smoothed, axis=1)

        dz_dy = dz_drow / dy_m
        dz_dx = dz_dcol / dx_m


    slope_degrees = np.degrees(
        np.arctan(np.hypot(dz_dx, dz_dy))
    )

    # Terrain safety and cost.
    # Change this threshold to match your rover's capabilities.
    MAX_SAFE_SLOPE = float(safelimites['maxSlope'])
    SLOPE_PENALTY_WEIGHT = 100.0

    MAX_SAFE_WIND = float(safelimites['maxWind'])
    WIND_PENALTY_WEIGHT = 50.0

    MAX_SAFE_RAD = float(safelimites['maxRadiation'])
    RAD_PENALTY_WEIGHT = 50.0

    MAX_SAFE_THERM = float(safelimites['maxTherm'])
    MIN_SAFE_THERM = float(safelimites['minTherm'])
    THERM_PENALTY_WEIGHT = 50.0

    safeThermalMask = (therm >= MIN_SAFE_THERM) & (therm <= MAX_SAFE_THERM)

    thermRange = MAX_SAFE_THERM - MIN_SAFE_THERM
    if thermRange <= 0:
        thermRange = 1.0

    therm_cost = THERM_PENALTY_WEIGHT * ((
        1.0 - (np.clip(
            (therm - MIN_SAFE_THERM) / thermRange,
            0.0,
            1.0
            ))) ** 2)
    
    rad_cost = RAD_PENALTY_WEIGHT * (
        np.clip(
            rad / MAX_SAFE_RAD,
            0.0,
            1.0
            ) ** 2)

    wind_cost = WIND_PENALTY_WEIGHT * (
        np.clip(
            wind / MAX_SAFE_WIND,
            0.0,
            1.0
            ) ** 2)

    terrain_cost = SLOPE_PENALTY_WEIGHT * (
        np.clip(
            slope_degrees / MAX_SAFE_SLOPE,
            0.0,
            1.0
        ) ** 2
    )

    total_cost = 1.0 + terrain_cost + therm_cost + rad_cost + wind_cost + resource_cost

    traversable = (
        valid_data
        & np.isfinite(slope_degrees)
        & np.isfinite(therm)
        & np.isfinite(rad)
        & np.isfinite(wind_cost)
        & (slope_degrees <= MAX_SAFE_SLOPE)
        & (rad <= MAX_SAFE_RAD)
        & (wind <= MAX_SAFE_WIND)
        & safeThermalMask
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
                f"of {MAX_SAFE_SLOPE} degrees,"
                f"or the temperature not between the max safe temperature {MAX_SAFE_THERM} or the min safe temperature {MIN_SAFE_THERM}."
            )

    # Find the least-cost route.
    max_cost = float(total_cost[traversable].max())
    blocked_cost = max(max_cost, 1.0) * 1e12

    cost_grid = np.where(
        traversable,
        total_cost,
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
    pathTempretures = therm[path_rows, path_cols]
    pathH2O = H2O[path_rows, path_cols]
    pathSlopes = slope_degrees[path_rows, path_cols]
    pathElevations = elevation[path_rows, path_cols]
    pathRad = rad[path_rows, path_cols]
    pathWind = wind[path_rows, path_cols]
    pathFe = fe[path_rows,path_cols]
    pathSi = si[path_rows,path_cols]

    # Calculate route distance in meters.
    if len(path_rows) < 2:
        route_length_km = 0.0
    else:
        row_diff = np.diff(path_rows)
        col_diff = np.diff(path_cols)

        dx_path_m = col_diff * dx_m
        dy_path_m = row_diff * dy_m

        route_length_km = float(np.sum(np.hypot(dx_path_m, dy_path_m))) / 1000

    
    execution_time = time.time() - start_time

    print("=" * 45)
    print(f"Execution time: {execution_time:.3f} seconds")
    print(f"Accumulated cost: {accumulated_cost:.3f}")
    print(f"Route length: {route_length_km:.2f} m")
    print(f"Maximum route slope: {pathSlopes.max():.2f} degrees")
    print("=" * 45)

    x_coords, y_coords = xy(transform, path_rows, path_cols)

    route_df = pd.DataFrame({
        "Step": range(1, len(path_rows) + 1),
        "X_coordinate": x_coords,
        "Y_coordinate": y_coords,
        "Elevation": pathElevations,
        "Slope_Degrees": pathSlopes,
        "therm": pathTempretures,
        "H2O": pathH2O,
        "Fe": pathFe,
        "Si": pathSi,
        "radiation": pathRad
    })

    return {
        "path_data": route_df.to_dict(orient="records"),
        "route_length": round(route_length_km, 2),
        "estimated_time": round(round(route_length_km, 2) / round(float(safelimites['speed']),2),2),
        "maximum_slope": round(float(pathSlopes.max()), 2),
        "minimum_slope": round(float(pathSlopes.min()), 2),
        "maximum_therm": round(float(pathTempretures.max()), 2),
        "minimum_therm": round(float(pathTempretures.min()), 2),
        "maximum_wind_speed": round(float(pathWind.max()), 2),
        "accumulated_cost": round(float(accumulated_cost), 3),
        "max_safe_slope": MAX_SAFE_SLOPE,
    }
def getLeastCostRoute(coordinates, tifFiles, safelimites):
    start_time = time.time()

    startX = float(coordinates['startX'])
    startY = float(coordinates['startY'])
    endX = float(coordinates['endX'])
    endY = float(coordinates['endY'])


    tifMap_path = getTifFile(tifFiles['elevation'])
    tifTherm_path = getTifFile(tifFiles['thermal'])
    tifH2O_path = getTifFile(tifFiles['H2O'])
    tifRad_path = getTifFile(tifFiles['rad'])
    tifWind_path = getTifFile(tifFiles['wind'])
    tifSi_path = getTifFile(tifFiles['si'])
    tifFe_path = getTifFile(tifFiles['fe'])

    with rasterio.open(tifWind_path) as src:
        wind = src.read(1).astype(np.float64)

    with rasterio.open(tifTherm_path) as src:
        therm = src.read(1).astype(np.float64)

    with rasterio.open(tifRad_path) as src:
        rad = src.read(1).astype(np.float64)

    with rasterio.open(tifH2O_path) as src:
        H2O = src.read(1).astype(np.float64)

    with rasterio.open(tifSi_path) as src:
        si = src.read(1).astype(np.float64)
    
    with rasterio.open(tifFe_path) as src:
        fe = src.read(1).astype(np.float64)

    with rasterio.open(tifMap_path) as src:
        elevation = src.read(1).astype(np.float64)
        transform = src.transform
        crs = src.crs
        nodata = src.nodata
        valid_mask = src.read_masks(1) > 0
        start_row, start_col = src.index(startX, startY)
        end_row, end_col = src.index(endX, endY)

    # Coordinates are coordinate indices: (row, column)
    start_node = (start_row, start_col)
    end_node = (end_row, end_col)

    height, width = elevation.shape

    # Validate start and end coordinates.
    for name, (row, col) in [
        ("Start", start_node),
        ("End", end_node),
    ]:
        if not (0 <= row < height and 0 <= col < width):
            raise ValueError(
                f"{name} coordinate {(row, col)} is outside the raster."
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

    # coordinate dimensions in coordinate units.
    coordinate_width = float(np.hypot(transform.a, transform.d))
    coordinate_height = float(np.hypot(transform.b, transform.e))

    if coordinate_width <= 0 or coordinate_height <= 0:
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

        dx_m = coordinate_width * meters_per_unit
        dy_m = coordinate_height * meters_per_unit

        dz_drow = np.gradient(smoothed, axis=0)
        dz_dcol = np.gradient(smoothed, axis=1)

        dz_dy = dz_drow / dy_m
        dz_dx = dz_dcol / dx_m


    slope_degrees = np.degrees(
        np.arctan(np.hypot(dz_dx, dz_dy))
    )

    # Terrain safety and cost.
    # Change this threshold to match your rover's capabilities.
    MAX_SAFE_SLOPE = float(safelimites['maxSlope'])
    SLOPE_PENALTY_WEIGHT = 100.0

    MAX_SAFE_WIND = float(safelimites['maxWind'])
    WIND_PENALTY_WEIGHT = 50.0

    MAX_SAFE_RAD = float(safelimites['maxRadiation'])
    RAD_PENALTY_WEIGHT = 50.0

    MAX_SAFE_THERM = float(safelimites['maxTherm'])
    MIN_SAFE_THERM = float(safelimites['minTherm'])
    THERM_PENALTY_WEIGHT = 50.0

    safeThermalMask = (therm >= MIN_SAFE_THERM) & (therm <= MAX_SAFE_THERM)

    thermRange = MAX_SAFE_THERM - MIN_SAFE_THERM
    if thermRange <= 0:
        thermRange = 1.0

    therm_cost = THERM_PENALTY_WEIGHT * ((
        1.0 - (np.clip(
            (therm - MIN_SAFE_THERM) / thermRange,
            0.0,
            1.0
            ))) ** 2)
    
    rad_cost = RAD_PENALTY_WEIGHT * (
        np.clip(
            rad / MAX_SAFE_RAD,
            0.0,
            1.0
            ) ** 2)

    wind_cost = WIND_PENALTY_WEIGHT * (
        np.clip(
            wind / MAX_SAFE_WIND,
            0.0,
            1.0
            ) ** 2)

    terrain_cost = SLOPE_PENALTY_WEIGHT * (
        np.clip(
            slope_degrees / MAX_SAFE_SLOPE,
            0.0,
            1.0
        ) ** 2
    )

    total_cost = 1.0 + terrain_cost + therm_cost + rad_cost + wind_cost

    traversable = (
        valid_data
        & np.isfinite(slope_degrees)
        & np.isfinite(therm)
        & np.isfinite(rad)
        & np.isfinite(wind_cost)
        & (slope_degrees <= MAX_SAFE_SLOPE)
        & (rad <= MAX_SAFE_RAD)
        & (wind <= MAX_SAFE_WIND)
        & safeThermalMask
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
                f"of {MAX_SAFE_SLOPE} degrees,"
                f"or the temperature not between the max safe temperature {MAX_SAFE_THERM} or the min safe temperature {MIN_SAFE_THERM}."
            )

    # Find the least-cost route.
    max_cost = float(total_cost[traversable].max())
    blocked_cost = max(max_cost, 1.0) * 1e12

    cost_grid = np.where(
        traversable,
        total_cost,
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

    pathTempretures = therm[path_rows, path_cols]
    pathH2O = H2O[path_rows, path_cols]
    pathSlopes = slope_degrees[path_rows, path_cols]
    pathElevations = elevation[path_rows, path_cols]
    pathRad = rad[path_rows, path_cols]
    pathWind = wind[path_rows, path_cols]
    pathFe = fe[path_rows, path_cols]
    pathSi = si[path_rows, path_cols]

    # Calculate route distance in meters.
    if len(path_rows) < 2:
        route_length_km = 0.0
    else:
        row_diff = np.diff(path_rows)
        col_diff = np.diff(path_cols)

        dx_path_m = col_diff * dx_m
        dy_path_m = row_diff * dy_m

        route_length_km = float(np.sum(np.hypot(dx_path_m, dy_path_m))) / 1000

    
    execution_time = time.time() - start_time

    print("=" * 45)
    print(f"Execution time: {execution_time:.3f} seconds")
    print(f"Accumulated cost: {accumulated_cost:.3f}")
    print(f"Route length: {route_length_km:.2f} m")
    print(f"Maximum route slope: {pathSlopes.max():.2f} degrees")
    print("=" * 45)

    x_coords, y_coords = xy(transform, path_rows, path_cols)

    route_df = pd.DataFrame({
        "Step": range(1, len(path_rows) + 1),
        "X_coordinate": x_coords,
        "Y_coordinate": y_coords,
        "Elevation": pathElevations,
        "Slope_Degrees": pathSlopes,
        "therm": pathTempretures,
        "Fe": pathFe,
        "Si": pathSi,
        "H2O": pathH2O,
        "radiation": pathRad
    })

    return {
        "path_data": route_df.to_dict(orient="records"),
        "route_length": round(route_length_km, 2),
        "estimated_time": round(round(route_length_km, 2) / round(float(safelimites['speed']),2),2),
        "maximum_slope": round(float(pathSlopes.max()), 2),
        "minimum_slope": round(float(pathSlopes.min()), 2),
        "maximum_therm": round(float(pathTempretures.max()), 2),
        "minimum_therm": round(float(pathTempretures.min()), 2),
        "maximum_wind_speed": round(float(pathWind.max()), 2),
        "accumulated_cost": round(float(accumulated_cost), 3),
        "max_safe_slope": MAX_SAFE_SLOPE,
    }

def getImageBounds(tif):
    file = getTifFile(tif)
    with rasterio.open(file) as src:
        bounds = src.bounds
        coordinates = [
            [bounds.left, bounds.top],
            [bounds.right, bounds.top],
            [bounds.right, bounds.bottom],
            [bounds.left, bounds.bottom]
        ]
        
        return coordinates

def getTifFile(tifname):
    return settings.TIF_PATH / tifname