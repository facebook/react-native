/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

jest.mock('fs');

const findPodfilePath = require('../../ios/findPodfilePath');
const fs = require('fs');
const projects = require('../../__fixtures__/projects');
const ios = require('../../__fixtures__/ios');

describe('ios::findPodfilePath', () => {
  it('returns null if there is no Podfile', () => {
    fs.__setMockFilesystem(ios.valid);
    expect(findPodfilePath('')).toBeNull();
  });

  it('returns Podfile path if it exists', () => {
    fs.__setMockFilesystem(projects.withPods);
    expect(findPodfilePath('/ios')).toContain('Podfile');
  });
});
