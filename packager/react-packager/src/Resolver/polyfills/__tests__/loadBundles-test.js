/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../loadBundles');
jest.mock('NativeModules');

let loadBundles;
let loadBundlesCalls;

describe('loadBundles', () => {
  beforeEach(() => {
    loadBundles = jest.genMockFunction();
    loadBundlesCalls = loadBundles.mock.calls;
    require('NativeModules').RCTBundlesLoader = {loadBundles};

    require('../loadBundles');
  });

  it('should set `global.__loadBundles` function when polyfill is initialized', () => {
    expect(typeof global.__loadBundles).toBe('function');
  });

  it('should return a promise', () => {
    loadBundles.mockImpl((bundles, callback) => callback());
    expect(global.__loadBundles(['bundle.0']) instanceof Promise).toBeTruthy();
  });

  pit('shouldn\'t request already loaded bundles', () => {
    loadBundles.mockImpl((bundles, callback) => callback());
    return global.__loadBundles(['bundle.0'])
      .then(() => global.__loadBundles(['bundle.0']))
      .then(() => expect(loadBundlesCalls.length).toBe(1));
  });

  pit('shouldn\'n request inflight bundles', () => {
    loadBundles.mockImpl((bundles, callback) => {
      if (bundles.length === 1 && bundles[0] === 'bundle.0') {
        setTimeout(callback, 1000);
      } else if (bundles.length === 1 && bundles[0] === 'bundle.1') {
        setTimeout(callback, 500);
      }
    });

    const promises = Promise.all([
      global.__loadBundles(['bundle.0']),
      global.__loadBundles(['bundle.0', 'bundle.1']),
    ]).then(() => {
      expect(loadBundlesCalls.length).toBe(2);
      expect(loadBundlesCalls[0][0][0]).toBe('bundle.0');
      expect(loadBundlesCalls[1][0][0]).toBe('bundle.1');
    });

    jest.runAllTimers();
    return promises;
  });
});
