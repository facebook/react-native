jest.autoMockOff();

const findAndroidAppFolder = require('../../src/config/android/findAndroidAppFolder');
const mockFs = require('mock-fs');
const mocks = require('../fixtures/android');

describe('android::findAndroidAppFolder', () => {
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
  }));

  it('should return an android app folder if it exists in the given folder', () => {
    expect(findAndroidAppFolder('flat')).toBe('android');
    expect(findAndroidAppFolder('nested')).toBe('android/app');
  });

  it('should return `null` if there\'s no android app folder', () => {
    expect(findAndroidAppFolder('empty')).toBe(null);
  });

  afterAll(mockFs.restore);
});
