/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

describe('ReactNativeFeatureFlags', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should provide default values for common flags and log an error if the native module is NOT available', () => {
    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');
    expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(false);

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Could not access feature flag 'commonTestFlag' because native module method was not available",
    );
  });

  it('should provide default values for common flags and log an error if the method in the native module is NOT available', () => {
    jest.doMock('../specs/NativeReactNativeFeatureFlags', () => ({
      __esModule: true,
      default: {},
    }));

    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');
    expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(false);

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Could not access feature flag 'commonTestFlag' because native module method was not available",
    );
  });

  it('should access and cache common flags from the native module if it is available', () => {
    const commonTestFlagFn = jest.fn(() => true);

    jest.doMock('../specs/NativeReactNativeFeatureFlags', () => ({
      __esModule: true,
      default: {
        commonTestFlag: commonTestFlagFn,
      },
    }));

    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');

    expect(commonTestFlagFn).toHaveBeenCalledTimes(0);

    expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(true);
    expect(commonTestFlagFn).toHaveBeenCalledTimes(1);

    expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(true);
    expect(commonTestFlagFn).toHaveBeenCalledTimes(1);
  });

  it('should provide default values for JS-only flags', () => {
    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');
    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(false);
  });

  it('should access and cache overridden JS-only flags', () => {
    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');

    const jsOnlyTestFlagFn = jest.fn(() => true);
    ReactNativeFeatureFlags.override({
      jsOnlyTestFlag: jsOnlyTestFlagFn,
    });

    expect(jsOnlyTestFlagFn).toHaveBeenCalledTimes(0);

    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
    expect(jsOnlyTestFlagFn).toHaveBeenCalledTimes(1);

    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
    expect(jsOnlyTestFlagFn).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if any of the JS flags has been accessed before overridding', () => {
    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');

    ReactNativeFeatureFlags.jsOnlyTestFlag();

    expect(() =>
      ReactNativeFeatureFlags.override({
        jsOnlyTestFlag: () => true,
      }),
    ).toThrow(
      'Feature flags were accessed before being overridden: jsOnlyTestFlag',
    );
  });

  it('should NOT throw an error if any of the common flags has been accessed before overridding', () => {
    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');

    ReactNativeFeatureFlags.commonTestFlag();

    expect(() => {
      ReactNativeFeatureFlags.override({
        jsOnlyTestFlag: () => true,
      });
    }).not.toThrow();

    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
  });

  it('should throw an error when trying to set overrides twice', () => {
    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');

    ReactNativeFeatureFlags.override({
      jsOnlyTestFlag: () => true,
    });

    expect(() =>
      ReactNativeFeatureFlags.override({
        jsOnlyTestFlag: () => false,
      }),
    ).toThrow('Feature flags cannot be overridden more than once');
  });
});
