/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * All rights reserved.
 *
 * @emails oncall+javascript_foundation
 */

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

  it('calls the function with an array of paths, given a project with one', () => {
    const callback = jest.fn();
    mapHeaderSearchPaths(project, callback);

    const paths = callback.mock.calls[0][0];

    expect(paths instanceof Array).toBe(true);
    expect(paths.length).toBe(1);
    expect(paths[0]).toBe('"$(inherited)"');
  });
});
