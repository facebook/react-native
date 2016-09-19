'use strict';

jest.autoMockOff();

const makePackagePatch = require('../../android/patches/makePackagePatch');
const applyParams = require('../../android/patches/applyParams');

const packageInstance = 'new SomeLibrary(${foo}, ${bar}, \'something\')';
const name = 'some-library';
const params = {
  foo: 'foo',
  bar: 'bar',
};

describe('makePackagePatch@0.20', () => {
  it('should build a patch', () => {
    const packagePatch = makePackagePatch(packageInstance, params, name);
    expect(Object.prototype.toString(packagePatch))
      .toBe('[object Object]');
  });

  it('MainActivity contains a correct 0.20 import patch', () => {
    const {patch} = makePackagePatch(packageInstance, params, name);
    const processedInstance = applyParams(packageInstance, params, name);

    expect(patch).toBe(',\n            ' + processedInstance);
  });
});
