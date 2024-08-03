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
  });

  it('should provide default values for common flags if the native module is NOT available', () => {
    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');
    expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(false);
  });

  it('should access and cache common flags from the native module if it is available', () => {
    const commonTestFlagFn = jest.fn(() => true);

    jest.doMock('../NativeReactNativeFeatureFlags', () => ({
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

  it('should throw an error if any of the flags has been accessed before overridding', () => {
    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');

    ReactNativeFeatureFlags.commonTestFlag();

    expect(() =>
      ReactNativeFeatureFlags.override({
        jsOnlyTestFlag: () => true,
      }),
    ).toThrow(
      'Feature flags were accessed before being overridden: commonTestFlag',
    );
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
