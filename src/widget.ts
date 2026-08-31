import GeoTIFF, { GeoTIFFImage, fromUrl } from 'geotiff';
import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';

// Import the CSS
import '../css/widget.css';

export class GeoTIFFModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: GeoTIFFModel.model_name,
      _model_module: GeoTIFFModel.model_module,
      _model_module_version: GeoTIFFModel.model_module_version,
      _view_name: GeoTIFFModel.view_name,
      _view_module: GeoTIFFModel.view_module,
      _view_module_version: GeoTIFFModel.view_module_version,
      _bounding_box: null,
      _do_from_url: '',
      _done_from_url: false,
      _do_get_image: false,
      _done_get_image: false,
      _do_read_rasters: false,
      _done_read_rasters: false,
      _do_read_rasters_bbox: false,
      _done_read_rasters_bbox: false,
      _read_rasters: null,
      _read_rasters_bbox_options: null,
      _read_rasters_window: null,
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    _read_rasters: {
      serialize: (value: ArrayBuffer[]) => value,
      deserialize: (value: DataView[]) => value,
    },
  };

  static model_name = 'GeoTIFFModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'GeoTIFFView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class GeoTIFFView extends DOMWidgetView {
  tiff: GeoTIFF;
  image: GeoTIFFImage;

  render() {
    this.model.on('change:_do_from_url', this.from_url, this);
    this.model.on('change:_do_get_image', this.get_image, this);
    this.model.on('change:_do_read_rasters', this.read_rasters, this);
    this.model.on('change:_do_read_rasters_bbox', this.read_rasters_bbox, this);
  }

  toggle(name: string) {
    this.model.set(name, !this.model.get(name));
    this.model.save_changes();
  }

  async from_url() {
    this.tiff = await fromUrl(this.model.get('_do_from_url'));
    this.toggle('_done_from_url');
  }

  async get_image() {
    this.image = await this.tiff.getImage();
    this.model.set('_bounding_box', this.image.getBoundingBox());
    this.model.save_changes();
    this.toggle('_done_get_image');
  }

  async read_rasters() {
    const data = await this.image.readRasters({
      window: this.model.get('_read_rasters_window'),
    });

    this.send_rasters(data);
    this.toggle('_done_read_rasters');
  }

  async read_rasters_bbox() {
    const data = await this.tiff.readRasters(
      this.model.get('_read_rasters_bbox_options'),
    );

    this.send_rasters(data);
    this.toggle('_done_read_rasters_bbox');
  }

  send_rasters(data: any) {
    const buffers = data.map((raster: any) =>
      raster.byteOffset === 0 && raster.byteLength === raster.buffer.byteLength
        ? raster.buffer
        : raster.buffer.slice(
            raster.byteOffset,
            raster.byteOffset + raster.byteLength,
          ),
    );

    this.model.set({
      _read_rasters: buffers,
      _read_rasters_metadata: {
        width: data.width,
        height: data.height,
        dtypes: data.map((raster: any) => raster.constructor.name),
      },
    });
    this.model.save_changes();
  }
}
