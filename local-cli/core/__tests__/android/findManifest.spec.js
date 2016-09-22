jest.autoMockOff();

const findManifest = require('../../config/android/findManifest');
const mockFs = require('mock-fs');
const mocks = require('../../__fixtures__/android');

describe('android::findManifest', () => {

  beforeAll(() => mockFs({
    empty: {},
    flat: {
      android: mocks.valid,
    },
    multipleManifests: {
      android: mocks.validMultipleManifests,
    },
  }));

  it('should return a manifest path if file exists in the folder', () => {
    expect(typeof findManifest('flat')).toBe('string');
  });

  it('should return `null` if there is no manifest in the folder', () => {
    expect(findManifest('empty')).toBe(null);
  });

  it('should return the main manifest before other manifests', () => {
    expect(findManifest('multipleManifests')).toMatch(/[\/\\]src[\/\\]main/);
  });

  afterAll(mockFs.restore);
});
