// Add any needed widget imports here (or from controls)
// import {} from '@jupyter-widgets/base';

jest.mock('geotiff', () => ({
  __esModule: true,
  default: jest.fn(),
  fromUrl: jest.fn(),
}));

import { createTestModel } from './utils';

import { GeoTIFFModel } from '..';

describe('GeoTIFF', () => {
  describe('GeoTIFFModel', () => {
    it('should be createable', () => {
      const model = createTestModel(GeoTIFFModel);
      expect(model).toBeInstanceOf(GeoTIFFModel);
      expect(model.get('_done_from_url')).toEqual(false);
    });

    it('should be createable with a value', () => {
      const state = { _bounding_box: [0, 1, 2, 3] };
      const model = createTestModel(GeoTIFFModel, state);
      expect(model).toBeInstanceOf(GeoTIFFModel);
      expect(model.get('_bounding_box')).toEqual([0, 1, 2, 3]);
    });
  });
});
