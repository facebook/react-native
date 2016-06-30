const chai = require('chai');
const expect = chai.expect;
const getDependencyConfig = require('../src/getDependencyConfig');
const sinon = require('sinon');

describe('getDependencyConfig', () => {
  it('should return an array of dependencies\' rnpm config', () => {
    const config = {
      getDependencyConfig: sinon.stub(),
    };

    expect(getDependencyConfig(config, ['abcd'])).to.be.an.array;
    expect(config.getDependencyConfig.callCount).to.equals(1);
  });

  it('should filter out invalid react-native projects', () => {
    const config = {
      getDependencyConfig: sinon.stub().throws(new Error('Cannot require')),
    };

    expect(getDependencyConfig(config, ['abcd'])).to.deep.equal([]);
  });
});
