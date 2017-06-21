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

const findPlugins = require('../findPlugins');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const pjsonPath = path.join(ROOT, 'package.json');

describe('findPlugins', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns an array of dependencies', () => {
    jest.mock(pjsonPath, () => ({
      dependencies: {'rnpm-plugin-test': '*'},
    }));
    expect(findPlugins([ROOT])).toHaveLength(1);
    expect(findPlugins([ROOT])[0]).toBe('rnpm-plugin-test');
  });

  it('returns an empty array if there are no plugins in this folder', () => {
    jest.mock(pjsonPath, () => ({}));
    expect(findPlugins([ROOT])).toHaveLength(0);
  });

  it('returns an empty array if there is no package.json in the supplied folder', () => {
    expect(Array.isArray(findPlugins(['fake-path']))).toBeTruthy();
    expect(findPlugins(['fake-path'])).toHaveLength(0);
  });

  it('returns plugins from both dependencies and dev dependencies', () => {
    jest.mock(pjsonPath, () => ({
      dependencies: {'rnpm-plugin-test': '*'},
      devDependencies: {'rnpm-plugin-test-2': '*'},
    }));
    expect(findPlugins([ROOT])).toHaveLength(2);
  });

  it('returns unique list of plugins', () => {
    jest.mock(pjsonPath, () => ({
      dependencies: {'rnpm-plugin-test': '*'},
      devDependencies: {'rnpm-plugin-test': '*'},
    }));
    expect(findPlugins([ROOT])).toHaveLength(1);
  });
});
