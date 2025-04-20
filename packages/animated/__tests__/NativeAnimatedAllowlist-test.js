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

describe('NativeAnimatedAllowlist', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('checks invalid style props', () => {
    const {isSupportedStyleProp} = require('../NativeAnimatedAllowlist');

    // $FlowExpectedError[incompatible-call]
    expect(isSupportedStyleProp(null)).toBe(false);
    // $FlowExpectedError[incompatible-call]
    expect(isSupportedStyleProp(undefined)).toBe(false);
    // $FlowExpectedError[incompatible-call]
    expect(isSupportedStyleProp({})).toBe(false);
    // $FlowExpectedError[incompatible-call]
    expect(isSupportedStyleProp([])).toBe(false);
    // $FlowExpectedError[incompatible-call]
    expect(isSupportedStyleProp(true)).toBe(false);
    // $FlowExpectedError[incompatible-call]
    expect(isSupportedStyleProp(false)).toBe(false);
  });

  it('checks supported interpolation params', () => {
    const {
      isSupportedInterpolationParam,
    } = require('../NativeAnimatedAllowlist');

    expect(isSupportedInterpolationParam('inputRange')).toBe(true);
    expect(isSupportedInterpolationParam('outputRange')).toBe(true);
    expect(isSupportedInterpolationParam('extrapolate')).toBe(true);
    expect(isSupportedInterpolationParam('extrapolateRight')).toBe(true);
    expect(isSupportedInterpolationParam('extrapolateLeft')).toBe(true);
  });

  it('allows new interpolation params', () => {
    const {
      allowInterpolationParam,
      isSupportedInterpolationParam,
    } = require('../NativeAnimatedAllowlist');

    expect(isSupportedInterpolationParam('other')).toBe(false);
    allowInterpolationParam('other');
    expect(isSupportedInterpolationParam('other')).toBe(true);
  });

  it('checks supported transform props', () => {
    jest
      .spyOn(
        require('react-native/src/private/featureflags/ReactNativeFeatureFlags'),
        'shouldUseAnimatedObjectForTransform',
      )
      .mockReturnValue(false);
    const {isSupportedTransformProp} = require('../NativeAnimatedAllowlist');

    expect(isSupportedTransformProp('translateX')).toBe(true);
    expect(isSupportedTransformProp('translateY')).toBe(true);

    expect(isSupportedTransformProp('matrix')).toBe(false);
  });

  it('checks supported transform props with object for transform', () => {
    jest
      .spyOn(
        require('react-native/src/private/featureflags/ReactNativeFeatureFlags'),
        'shouldUseAnimatedObjectForTransform',
      )
      .mockReturnValue(true);
    const {isSupportedTransformProp} = require('../NativeAnimatedAllowlist');

    expect(isSupportedTransformProp('translateX')).toBe(true);
    expect(isSupportedTransformProp('translateY')).toBe(true);

    expect(isSupportedTransformProp('matrix')).toBe(true);
  });
});
