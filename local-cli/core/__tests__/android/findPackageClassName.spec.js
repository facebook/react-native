jest.autoMockOff();

const findPackageClassName = require('../../config/android/findPackageClassName');
const mockFs = require('mock-fs');
const mocks = require('../../__fixtures__/android');

describe('android::findPackageClassName', () => {

  beforeAll(() => mockFs({
    empty: {},
    flat: {
      android: mocks.valid,
    },
  }));

  it('should return manifest content if file exists in the folder', () => {
    expect(typeof findPackageClassName('flat')).toBe('string');
  });

  it('should return `null` if there\'s no matches', () => {
    expect(findPackageClassName('empty')).toBe(null);
  });

  afterAll(mockFs.restore);
});
