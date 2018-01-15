jest.autoMockOff();

const findManifest = require('../../android/findManifest');
const mockFs = require('mock-fs');
const mocks = require('../../__fixtures__/android');

describe('android::findManifest', () => {

  beforeAll(() => mockFs({
    empty: {},
    flat: {
      android: mocks.valid,
    },
  }));

  it('should return a manifest path if file exists in the folder', () => {
    expect(typeof findManifest('flat')).toBe('string');
  });

  it('should return `null` if there is no manifest in the folder', () => {
    expect(findManifest('empty')).toBe(null);
  });

  afterAll(mockFs.restore);
});
