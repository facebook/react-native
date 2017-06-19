'use strict';

const getDependencyConfig = require('../getDependencyConfig');
const sinon = require('sinon');

describe('getDependencyConfig', () => {
  it('should return an array of dependencies\' rnpm config', () => {
    const config = {
      getDependencyConfig: sinon.stub(),
    };

    expect(Array.isArray(getDependencyConfig(config, ['abcd']))).toBeTruthy();
    expect(config.getDependencyConfig.callCount).toEqual(1);
  });

  it('should filter out invalid react-native projects', () => {
    const config = {
      getDependencyConfig: sinon.stub().throws(new Error('Cannot require')),
    };

    expect(getDependencyConfig(config, ['abcd'])).toEqual([]);
  });
});
