jest.autoMockOff();

const findAssets = require('../findAssets');
const mockFs = require('mock-fs');
const dependencies = require('../__fixtures__/dependencies');
const isArray = (arg) =>
  Object.prototype.toString.call(arg) === '[object Array]';

describe('findAssets', () => {

  beforeEach(() => mockFs({ testDir: dependencies.withAssets }));

  it('should return an array of all files in given folders', () => {
    const assets = findAssets('testDir', ['fonts', 'images']);

    expect(isArray(assets)).toBeTruthy();
    expect(assets.length).toEqual(3);
  });

  it('should prepend assets paths with the folder path', () => {
    const assets = findAssets('testDir', ['fonts', 'images']);

    assets.forEach(assetPath => expect(assetPath).toContain('testDir'));
  });

  it('should return an empty array if given assets are null', () => {
    expect(findAssets('testDir', null).length).toEqual(0);
  });

  afterEach(mockFs.restore);
});
