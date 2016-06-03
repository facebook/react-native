'use strict';

jest.autoMockOff();

const getMainActivityPatch = require('../src/android/getPrefix');
const newPrefix = 'patches/0.18';
const oldPrefix = 'patches/0.17';

describe('getPrefix', () => {
  it('require a specific patch for react-native < 0.18', () => {
    expect(getMainActivityPatch('0.17.0-rc')).toEqual(oldPrefix);
    expect(getMainActivityPatch('0.17.1-rc2')).toEqual(oldPrefix);
    expect(getMainActivityPatch('0.17.2')).toEqual(oldPrefix);
  });

  it('require a specific patch for react-native > 0.18', () => {
    expect(getMainActivityPatch('0.19.0')).toEqual(newPrefix);
    expect(getMainActivityPatch('0.19.0-rc')).toEqual(newPrefix);
    expect(getMainActivityPatch('0.18.0-rc1')).toEqual(newPrefix);
    expect(getMainActivityPatch('0.18.2')).toEqual(newPrefix);
  });
});
