'use strict';

const xcode = require('xcode');
const mapHeaderSearchPaths = require('../../ios/mapHeaderSearchPaths');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::mapHeaderSearchPaths', () => {
  beforeEach(() => {
    project.parseSync();
  });

  /**
   * Based on the fixtures, our assumption is that this function
   * has to be executed two times.
   */
  it('should be called twice', () => {
    const callback = jest.fn();
    mapHeaderSearchPaths(project, callback);

    expect(callback.mock.calls.length).toBe(2);
  });
});
