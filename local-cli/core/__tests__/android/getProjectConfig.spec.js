jest.autoMockOff();

const getProjectConfig = require('../../android').projectConfig;
const mockFs = require('mock-fs');
const mocks = require('../../__fixtures__/android');

describe('android::getProjectConfig', () => {
  beforeAll(() => mockFs({
    empty: {},
    nested: {
      android: {
        app: mocks.valid,
      },
    },
    flat: {
      android: mocks.valid,
    },
    multiple: {
      android: mocks.userConfigManifest,
    },
    noManifest: {
      android: {},
    },
  }));

  it('should return `null` if manifest file hasn\'t been found', () => {
    const userConfig = {};
    const folder = 'noManifest';

    expect(getProjectConfig(folder, userConfig)).toBe(null);
  });

  describe('return an object with android project configuration for', () => {
    it('nested structure', () => {
      const userConfig = {};
      const folder = 'nested';

      expect(getProjectConfig(folder, userConfig)).not.toBe(null);
      expect(typeof getProjectConfig(folder, userConfig)).toBe('object');
    });

    it('flat structure', () => {
      const userConfig = {};
      const folder = 'flat';

      expect(getProjectConfig(folder, userConfig)).not.toBe(null);
      expect(typeof getProjectConfig(folder, userConfig)).toBe('object');
    });

    it('multiple', () => {
      const userConfig = {
        manifestPath: 'src/main/AndroidManifest.xml'
      };
      const folder = 'multiple';

      expect(getProjectConfig(folder, userConfig)).not.toBe(null);
      expect(typeof getProjectConfig(folder, userConfig)).toBe('object');
    });
  });

  it('should return `null` if android project was not found', () => {
    const userConfig = {};
    const folder = 'empty';

    expect(getProjectConfig(folder, userConfig)).toBe(null);
  });

  afterAll(mockFs.restore);
});
