/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */
'use strict';

describe('checkVersion', () => {
  describe('in development', () => {
    _setDevelopmentModeForTests(true);
    _defineCheckVersionTests();
  });

  describe('in production', () => {
    _setDevelopmentModeForTests(false);
    _defineCheckVersionTests();
  });
});

function _setDevelopmentModeForTests(dev) {
  let originalDev;

  beforeAll(() => {
    originalDev = global.__DEV__;
    global.__DEV__ = dev;
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
  });
}

function _defineCheckVersionTests() {
  afterEach(() => {
    jest.resetModules();
  });

  it('passes when all the versions are zero', () => {
    _mockJsVersion(0, 0, 0);
    _mockNativeVersion(0, 0, 0);

    const ReactNativeVersion = require('ReactNativeVersion');
    const ReactNativeVersionCheck = require('ReactNativeVersionCheck');
    expect(ReactNativeVersion).toMatchObject({
      version: {major: 0, minor: 0, patch: 0, prerelease: null},
    });
    expect(() => ReactNativeVersionCheck.checkVersions()).not.toThrow();
  });

  it('passes when the minor matches when the major is zero', () => {
    _mockJsVersion(0, 1, 0);
    _mockNativeVersion(0, 1, 0);

    const ReactNativeVersionCheck = require('ReactNativeVersionCheck');
    expect(() => ReactNativeVersionCheck.checkVersions()).not.toThrow();
  });

  it("throws when the minor doesn't match when the major is zero", () => {
    _mockJsVersion(0, 1, 0);
    _mockNativeVersion(0, 2, 0);

    const ReactNativeVersionCheck = require('ReactNativeVersionCheck');
    expect(() => ReactNativeVersionCheck.checkVersions()).toThrowError(
      /React Native version mismatch/,
    );
  });

  it("throws when the major doesn't match", () => {
    _mockJsVersion(1, 0, 0);
    _mockNativeVersion(2, 0, 0);

    const ReactNativeVersionCheck = require('ReactNativeVersionCheck');
    expect(() => ReactNativeVersionCheck.checkVersions()).toThrowError(
      /React Native version mismatch/,
    );
  });

  it("doesn't throw if the patch doesn't match", () => {
    _mockJsVersion(0, 1, 0);
    _mockNativeVersion(0, 1, 2);

    const ReactNativeVersionCheck = require('ReactNativeVersionCheck');
    expect(() => ReactNativeVersionCheck.checkVersions()).not.toThrow();
  });

  it("doesn't throw if the prerelease doesn't match", () => {
    _mockJsVersion(0, 1, 0, 'beta.0');
    _mockNativeVersion(0, 1, 0, 'alpha.1');

    const ReactNativeVersionCheck = require('ReactNativeVersionCheck');
    expect(() => ReactNativeVersionCheck.checkVersions()).not.toThrow();
  });
}

function _mockJsVersion(major = 0, minor = 0, patch = 0, prerelease = null) {
  jest.doMock('ReactNativeVersion', () => ({
    version: {major, minor, patch, prerelease},
  }));
}

function _mockNativeVersion(
  major = 0,
  minor = 0,
  patch = 0,
  prerelease = null,
) {
  jest.doMock('NativeModules', () => ({
    PlatformConstants: {
      reactNativeVersion: {major, minor, patch, prerelease},
    },
  }));
}
