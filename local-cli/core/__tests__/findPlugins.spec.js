/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

jest.autoMockOff();

const path = require('path');
const findPlugins = require('../findPlugins');

const ROOT = path.join(__dirname, '..', '..', '..');
const pjsonPath = path.join(ROOT, 'package.json');
const isArray = (arg) =>
  Object.prototype.toString.call(arg) === '[object Array]';

describe('findPlugins', () => {

  beforeEach(() => jest.resetModules());

  it('should return an array of dependencies', () => {
    jest.mock(pjsonPath, () => ({
      dependencies: { 'rnpm-plugin-test': '*' },
    }));
    expect(findPlugins([ROOT]).length).toBe(1);
    expect(findPlugins([ROOT])[0]).toBe('rnpm-plugin-test');
  });

  it('should return an empty array if there\'re no plugins in this folder', () => {
    jest.mock(pjsonPath, () => ({}));
    expect(findPlugins([ROOT]).length).toBe(0);
  });

  it('should return an empty array if there\'s no package.json in the supplied folder', () => {
    expect(isArray(findPlugins(['fake-path']))).toBeTruthy();
    expect(findPlugins(['fake-path']).length).toBe(0);
  });

  it('should return plugins from both dependencies and dev dependencies', () => {
    jest.mock(pjsonPath, () => ({
      dependencies: { 'rnpm-plugin-test': '*' },
      devDependencies: { 'rnpm-plugin-test-2': '*' },
    }));
    expect(findPlugins([ROOT]).length).toEqual(2);
  });

  it('should return unique list of plugins', () => {
    jest.mock(pjsonPath, () => ({
      dependencies: { 'rnpm-plugin-test': '*' },
      devDependencies: { 'rnpm-plugin-test': '*' },
    }));
    expect(findPlugins([ROOT]).length).toEqual(1);
  });

});
