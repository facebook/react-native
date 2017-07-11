/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */

'use strict';

const findPodfilePath = require('../../ios/findPodfilePath');
const mockFS = require('mock-fs');
const projects = require('../../__fixtures__/projects');
const ios = require('../../__fixtures__/ios');

describe('ios::findPodfilePath', () => {
  it('returns null if there is no Podfile', () => {
    mockFS(ios.valid);
    expect(findPodfilePath('')).toBeNull()
  });

  it('returns Podfile path if it exists', () => {
    mockFS(projects.withPods);
    expect(findPodfilePath('ios')).toContain('Podfile');
  });

  afterEach(() => {
    mockFS.restore();
  });

});
