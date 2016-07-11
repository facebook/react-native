const chai = require('chai');
const expect = chai.expect;
const getProjectDependencies = require('../src/getProjectDependencies');
const mock = require('mock-require');
const path = require('path');

describe('getProjectDependencies', () => {

  it('should return an array of project dependencies', () => {
    mock(
      path.join(process.cwd(), './package.json'),
      { dependencies: { lodash: '^6.0.0', 'react-native': '^16.0.0' } }
    );

    expect(getProjectDependencies()).to.deep.equals(['lodash']);
  });

  it('should return an empty array when no dependencies set', () => {
    mock(path.join(process.cwd(), './package.json'), {});
    expect(getProjectDependencies()).to.deep.equals([]);
  });

  afterEach(() => {
    mock.stopAll();
  });

});
