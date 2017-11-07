/**
 * Copyright (c) 2013-present, Facebook, Inc.
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

const path = require('path');
const isInstalled = require('../../pods/isInstalled');

const PODFILES_PATH = path.join(__dirname, '../../__fixtures__/pods');

describe('pods::isInstalled', () => {
  it('returns false if pod is missing', () => {
    const project = { podfile: path.join(PODFILES_PATH, 'PodfileSimple') };
    const podspecName = { podspec: 'NotExisting' };
    expect(isInstalled(project, podspecName)).toBe(false);
  });

  it('returns true for existing pod with version number', () => {
    const project = { podfile: path.join(PODFILES_PATH, 'PodfileSimple') };
    const podspecName = { podspec: 'TestPod' };
    expect(isInstalled(project, podspecName)).toBe(true);
  });

  it('returns true for existing pod with path', () => {
    const project = { podfile: path.join(PODFILES_PATH, 'PodfileWithTarget') };
    const podspecName = { podspec: 'Yoga' };
    expect(isInstalled(project, podspecName)).toBe(true);
  });

  it('returns true for existing pod with multiline definition', () => {
    const project = { podfile: path.join(PODFILES_PATH, 'PodfileWithFunction') };
    const podspecName = { podspec: 'React' };
    expect(isInstalled(project, podspecName)).toBe(true);
  });
});
