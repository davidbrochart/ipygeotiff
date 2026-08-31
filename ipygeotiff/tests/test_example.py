from ..geotiff import GeoTIFF


def test_geotiff_creation_blank():
    widget = GeoTIFF()
    assert widget._bounding_box == [0.0, 0.0, 0.0, 0.0]
