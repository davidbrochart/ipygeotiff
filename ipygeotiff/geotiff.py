from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import numpy as np
from ipywidgets import DOMWidget
from ipywidgets.widgets.trait_types import CByteMemoryView
from traitlets import Bool, Dict, List, Unicode

from ._frontend import module_name, module_version

DTYPE_BY_NAME = {
    "Uint8Array": np.uint8,
    "Uint8ClampedArray": np.uint8,
    "Int8Array": np.int8,
    "Uint16Array": np.uint16,
    "Int16Array": np.int16,
    "Uint32Array": np.uint32,
    "Int32Array": np.int32,
    "Float32Array": np.float32,
    "Float64Array": np.float64,
}


class GeoTIFF(DOMWidget):
    """The widget that allows communicating with geotiffjs."""

    _model_name = Unicode("GeoTIFFModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("GeoTIFFView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    _do_from_url = Unicode("").tag(sync=True)
    _done_from_url = Bool(False).tag(sync=True)
    _do_get_image = Bool(False).tag(sync=True)
    _done_get_image = Bool(False).tag(sync=True)
    _do_read_rasters = Bool(False).tag(sync=True)
    _done_read_rasters = Bool(False).tag(sync=True)
    _read_rasters_window = List([0, 0, 0, 0]).tag(sync=True)
    _read_rasters = List(CByteMemoryView()).tag(sync=True)
    _read_rasters_metadata = Dict().tag(sync=True)
    _do_read_rasters_bbox = Bool(False).tag(sync=True)
    _done_read_rasters_bbox = Bool(False).tag(sync=True)
    _read_rasters_bbox_options = Dict().tag(sync=True)
    _bounding_box = List([0.0, 0.0, 0.0, 0.0]).tag(sync=True)

    async def from_url(self, url: str) -> GeoTIFF:
        async with wait(self, "_done_from_url"):
            self._do_from_url = url
        return self

    async def get_image(self) -> GeoTIFFImage:
        async with wait(self, "_done_get_image"):
            self._do_get_image = not self._do_get_image

        return GeoTIFFImage(self)

    async def read_rasters(
        self,
        *,
        bbox: list[float],
        width: float | None = None,
        height: float | None = None,
    ) -> list[np.ndarray]:
        options: dict = {"bbox": bbox}
        if width is not None:
            options["width"] = width
        if height is not None:
            options["height"] = height

        async with wait(self, "_done_read_rasters_bbox"):
            self._read_rasters_bbox_options = options
            self._do_read_rasters_bbox = not self._do_read_rasters_bbox

        return decode_rasters(self)


class GeoTIFFImage:
    def __init__(self, widget: GeoTIFF) -> None:
        self._widget = widget

    @property
    def bounding_box(self) -> list[float]:
        return list(self._widget._bounding_box)

    async def read_rasters(self, *, window: list[int]) -> list[np.ndarray]:
        async with wait(self._widget, "_done_read_rasters"):
            self._widget._read_rasters_window = window
            self._widget._do_read_rasters = not self._widget._do_read_rasters

        return decode_rasters(self._widget)


def decode_rasters(widget: GeoTIFF) -> list[np.ndarray]:
    metadata = widget._read_rasters_metadata
    height = metadata["height"]
    width = metadata["width"]

    return [
        np.frombuffer(raster, dtype=DTYPE_BY_NAME[dtype]).reshape(height, width)
        for raster, dtype in zip(widget._read_rasters, metadata["dtypes"])
    ]


@asynccontextmanager
async def wait(widget: DOMWidget, name: str) -> AsyncIterator[None]:
    event = asyncio.Event()

    def get_value(change: dict[str, Any]) -> None:
        event.set()
        widget.unobserve(get_value, name)

    widget.observe(get_value, name)
    done = event.wait()
    yield
    await done
