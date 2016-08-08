'use strict';

jest.autoMockOff();

const applyParams = require('../../src/android/patches/applyParams');

describe('applyParams', () => {
  it('apply params to the string', () => {
    expect(
      applyParams('${foo}', {foo: 'foo'}, 'react-native')
    ).toEqual('this.getResources().getString(R.string.reactNative_foo)');
  });

  it('use null if no params provided', () => {
    expect(
      applyParams('${foo}', {}, 'react-native')
    ).toEqual('null');
  });
});
