'use strict';

jest.autoMockOff();

const getProjectDependencies = require('../getProjectDependencies');
const path = require('path');

describe('getProjectDependencies', () => {

  it('should return an array of project dependencies', () => {
    jest.setMock(
      path.join(process.cwd(), './package.json'),
      { dependencies: { lodash: '^6.0.0', 'react-native': '^16.0.0' }}
    );

    expect(getProjectDependencies()).toEqual(['lodash']);
  });

  it('should return an empty array when no dependencies set', () => {
    jest.setMock(path.join(process.cwd(), './package.json'), {});
    expect(getProjectDependencies()).toEqual([]);
  });
});
