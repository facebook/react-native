/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
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
  const consoleError = console.error;
  const globalConsole = global.console;

  let spyOnConsoleError;
  let consoleOutput;

  beforeEach(() => {
    consoleOutput = '';
    console.error = jest.fn();
    global.console = {error: jest.fn(error => (consoleOutput += error))};
    spyOnConsoleError = jest.spyOn(global.console, 'error');
  });

  afterEach(() => {
    jest.resetModules();
    console.error = consoleError;
    global.console = globalConsole;
    spyOnConsoleError.mockReset();
  });

  it('passes when all the versions are zero', () => {
    _mockJsVersion(0, 0, 0);
    _mockNativeVersion(0, 0, 0);

    const ReactNativeVersion = require('../ReactNativeVersion');
    const ReactNativeVersionCheck = require('../ReactNativeVersionCheck');
    expect(ReactNativeVersion).toMatchObject({
      version: {major: 0, minor: 0, patch: 0, prerelease: null},
    });
    expect(() => ReactNativeVersionCheck.checkVersions()).not.toThrow();
  });

  it('passes when the minor matches when the major is zero', () => {
    _mockJsVersion(0, 1, 0);
    _mockNativeVersion(0, 1, 0);

    const ReactNativeVersionCheck = require('../ReactNativeVersionCheck');
    expect(() => ReactNativeVersionCheck.checkVersions()).not.toThrow();
  });

  it("logs error when the minor doesn't match when the major is zero", () => {
    _mockJsVersion(0, 1, 0);
    _mockNativeVersion(0, 2, 0);

    const ReactNativeVersionCheck = require('../ReactNativeVersionCheck');

    ReactNativeVersionCheck.checkVersions();
    expect(spyOnConsoleError).toHaveBeenCalledTimes(1);
    expect(consoleOutput).toMatch(/React Native version mismatch/);
  });

  it("logs error when the major doesn't match", () => {
    _mockJsVersion(1, 0, 0);
    _mockNativeVersion(2, 0, 0);

    const ReactNativeVersionCheck = require('../ReactNativeVersionCheck');
    ReactNativeVersionCheck.checkVersions();
    expect(spyOnConsoleError).toHaveBeenCalledTimes(1);
    expect(consoleOutput).toMatch(/React Native version mismatch/);
  });

  it("doesn't log error if the patch doesn't match", () => {
    _mockJsVersion(0, 1, 0);
    _mockNativeVersion(0, 1, 2);

    const ReactNativeVersionCheck = require('../ReactNativeVersionCheck');
    ReactNativeVersionCheck.checkVersions();
    expect(spyOnConsoleError).toHaveBeenCalledTimes(0);
  });

  it("doesn't log error if the prerelease doesn't match", () => {
    _mockJsVersion(0, 1, 0, 'beta.0');
    _mockNativeVersion(0, 1, 0, 'alpha.1');

    const ReactNativeVersionCheck = require('../ReactNativeVersionCheck');
    ReactNativeVersionCheck.checkVersions();
    expect(spyOnConsoleError).toHaveBeenCalledTimes(0);
  });
}

function _mockJsVersion(major = 0, minor = 0, patch = 0, prerelease = null) {
  jest.doMock('../ReactNativeVersion', () => ({
    version: {major, minor, patch, prerelease},
  }));
}

function _mockNativeVersion(
  major = 0,
  minor = 0,
  patch = 0,
  prerelease = null,
) {
  jest.doMock('../../Utilities/NativePlatformConstantsAndroid', () => ({
    getConstants: () => ({
      reactNativeVersion: {major, minor, patch, prerelease},
    }),
  }));
  jest.doMock('../../Utilities/NativePlatformConstantsIOS', () => ({
    getConstants: () => ({
      reactNativeVersion: {major, minor, patch, prerelease},
    }),
  }));
}
