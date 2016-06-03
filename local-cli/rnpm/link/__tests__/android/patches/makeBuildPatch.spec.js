'use strict';

jest.autoMockOff();

const makeBuildPatch = require('../../../src/android/patches/makeBuildPatch');
const name = 'test';

describe('makeBuildPatch', () => {
  it('should build a patch function', () => {
    expect(Object.prototype.toString(makeBuildPatch(name)))
      .toBe('[object Object]');
  });

  it('should make a correct patch', () => {
    expect(makeBuildPatch(name).patch)
      .toBe(`    compile project(':${name}')\n`);
  });
});
