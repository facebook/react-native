const chai = require('chai');
const expect = chai.expect;
const applyParams = require('../../../src/android/patches/applyParams');

describe('applyParams', () => {
  it('apply params to the string', () => {
    expect(
      applyParams('${foo}', {foo: 'foo'}, 'react-native')
    ).to.be.equal('this.getResources().getString(R.strings.reactNative_foo)');
  });

  it('use null if no params provided', () => {
    expect(
      applyParams('${foo}', {}, 'react-native')
    ).to.be.equal('null');
  });
});
