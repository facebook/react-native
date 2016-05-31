const chai = require('chai');
const expect = chai.expect;
const getMainActivityPatch = require('../src/android/getPrefix');
const newPrefix = 'patches/0.18';
const oldPrefix = 'patches/0.17';

describe('getPrefix', () => {
  it('require a specific patch for react-native < 0.18', () => {
    expect(getMainActivityPatch('0.17.0-rc')).to.equals(oldPrefix);
    expect(getMainActivityPatch('0.17.1-rc2')).to.equals(oldPrefix);
    expect(getMainActivityPatch('0.17.2')).to.equals(oldPrefix);
  });

  it('require a specific patch for react-native > 0.18', () => {
    expect(getMainActivityPatch('0.19.0')).to.equals(newPrefix);
    expect(getMainActivityPatch('0.19.0-rc')).to.equals(newPrefix);
    expect(getMainActivityPatch('0.18.0-rc1')).to.equals(newPrefix);
    expect(getMainActivityPatch('0.18.2')).to.equals(newPrefix);
  });
});
