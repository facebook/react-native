const chai = require('chai');
const expect = chai.expect;
const makeBuildPatch = require('../../../src/android/patches/makeBuildPatch');
const applyPatch = require('../../../src/android/patches/applyPatch');

const name = 'test';

describe('makeBuildPatch', () => {
  it('should build a patch function', () => {
    expect(makeBuildPatch(name)).to.be.an('object');
  });

  it('should make a correct patch', () => {
    expect(makeBuildPatch(name).patch)
      .to.be.equal(`    compile project(':${name}')\n`);
  });
});
