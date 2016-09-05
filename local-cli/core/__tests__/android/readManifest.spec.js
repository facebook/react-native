jest.autoMockOff();

const findManifest = require('../../config/android/findManifest');
const readManifest = require('../../config/android/readManifest');
const mockFs = require('mock-fs');
const mocks = require('../../__fixtures__/android');

describe('android::readManifest', () => {

  beforeAll(() => mockFs({
    empty: {},
    nested: {
      android: {
        app: mocks.valid,
      },
    },
  }));

  it('should return manifest content if file exists in the folder', () => {
    const manifestPath = findManifest('nested');
    expect(readManifest(manifestPath)).not.toBe(null);
    expect(typeof readManifest(manifestPath)).toBe('object');
  });

  it('should throw an error if there is no manifest in the folder', () => {
    const fakeManifestPath = findManifest('empty');
    expect(() => readManifest(fakeManifestPath)).toThrow();
  });

  afterAll(mockFs.restore);
});
