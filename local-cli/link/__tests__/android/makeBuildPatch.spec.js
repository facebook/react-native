'use strict';

const makeBuildPatch = require('../../android/patches/makeBuildPatch');
const name = 'test';

const buildPatch = 'import some.example.project';

describe('makeBuildPatch', () => {
  it('should build a patch function (no custom buildPatch)', () => {
    expect(Object.prototype.toString(makeBuildPatch(name)))
      .toBe('[object Object]');
  });

  it('should make a correct patch (no custom buildPatch)', () => {
    const {patch} = makeBuildPatch(name);
    expect(patch).toBe(`    compile project(':${name}')\n`);
  });

  it('should build a patch function (custom buildPatch)', () => {
    expect(Object.prototype.toString(makeBuildPatch(name, buildPatch)))
      .toBe('[object Object]');
  });

  it('should make a correct patch (custom buildPatch)', () => {
    const {patch} = makeBuildPatch(name, buildPatch);
    expect(patch).toBe(buildPatch);
  });

  it('should make a correct install check pattern', () => {
    const {installPattern} = makeBuildPatch(name);
    const match = `/\\s{4}(compile)(\\(|\\s)(project)\\(\\':${name}\\'\\)(\\)|\\s)/`;
    expect(installPattern.toString()).toBe(match);
  });
});
