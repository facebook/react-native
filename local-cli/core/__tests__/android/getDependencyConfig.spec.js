jest.autoMockOff();

const getDependencyConfig = require('../../android').dependencyConfig;
const mockFs = require('mock-fs');
const mocks = require('../../__fixtures__/android');
const userConfig = {};

describe('android::getDependencyConfig', () => {

  beforeAll(() => mockFs({
    empty: {},
    nested: {
      android: {
        app: mocks.valid,
      },
    },
    corrupted: {
      android: {
        app: mocks.corrupted,
      },
    },
    noPackage: {
      android: {},
    },
  }));

  it('should return an object with android project configuration', () => {
    expect(getDependencyConfig('nested', userConfig)).not.toBe(null);
    expect(typeof getDependencyConfig('nested', userConfig)).toBe('object');
  });

  it('should return `null` if manifest file hasn\'t been found', () => {
    expect(getDependencyConfig('empty', userConfig)).toBe(null);
  });

  it('should return `null` if android project was not found', () => {
    expect(getDependencyConfig('empty', userConfig)).toBe(null);
  });

  it('should return `null` if android project does not contain ReactPackage', () => {
    expect(getDependencyConfig('noPackage', userConfig)).toBe(null);
  });

  it('should return `null` if it can\'t find a packageClassName', () => {
    expect(getDependencyConfig('corrupted', userConfig)).toBe(null);
  });

  afterAll(mockFs.restore);
});
