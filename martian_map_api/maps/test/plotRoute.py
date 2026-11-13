import multiprocessing
import matplotlib
import matplotlib.pyplot as plt
from rasterio.plot import plotting_extent
from rasterio.transform import xy


def _plot_worker(elevation, transform, path_rows, path_cols):
    fig, ax = plt.subplots(figsize=(10, 8))

    extent = plotting_extent(elevation, transform)
    im = ax.imshow(elevation, cmap='terrain', extent=extent, origin='upper')
    fig.colorbar(im, ax=ax, shrink=0.8, label='Elevation (m)')

    x_coords, y_coords = xy(transform, path_rows, path_cols)

    ax.plot(x_coords, y_coords, color='red', linewidth=2.5, label='Optimal Path')
    ax.scatter(x_coords[0], y_coords[0], color='lime', s=120, edgecolors='black', zorder=5, label='Start')
    ax.scatter(x_coords[-1], y_coords[-1], color='cyan', s=120, edgecolors='black', zorder=5, label='End')

    ax.set_title("Rover Least-Cost Route on Elevation Map", fontsize=14, fontweight='bold')
    ax.set_xlabel("X Coordinate (m)")
    ax.set_ylabel("Y Coordinate (m)")
    ax.legend(loc='upper right')

    plt.tight_layout()
    plt.show()


def plot_route_on_elevation(elevation, transform, path_rows, path_cols):
   
    process = multiprocessing.Process(
        target=_plot_worker,
        args=(elevation, transform, path_rows, path_cols),
        daemon=True
    )
    process.start()