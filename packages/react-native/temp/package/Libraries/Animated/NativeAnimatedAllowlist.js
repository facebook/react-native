/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as ReactNativeFeatureFlags from '../../src/private/featureflags/ReactNativeFeatureFlags';

/**
 * Styles allowed by the native animated implementation.
 *
 * In general native animated implementation should support any numeric or color property that
 * doesn't need to be updated through the shadow view hierarchy (all non-layout properties).
 */
const SUPPORTED_COLOR_STYLES: {[string]: boolean} = {
  backgroundColor: true,
  borderBottomColor: true,
  borderColor: true,
  borderEndColor: true,
  borderLeftColor: true,
  borderRightColor: true,
  borderStartColor: true,
  borderTopColor: true,
  color: true,
  tintColor: true,
};

const SUPPORTED_STYLES: {[string]: boolean} = {
  ...SUPPORTED_COLOR_STYLES,
  borderBottomEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderEndEndRadius: true,
  borderEndStartRadius: true,
  borderRadius: true,
  borderTopEndRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  borderStartEndRadius: true,
  borderStartStartRadius: true,
  elevation: true,
  opacity: true,
  transform: true,
  zIndex: true,
  /* ios styles */
  shadowOpacity: true,
  shadowRadius: true,
  /* legacy android transform properties */
  scaleX: true,
  scaleY: true,
  translateX: true,
  translateY: true,
};

const SUPPORTED_TRANSFORMS: {[string]: boolean} = {
  translateX: true,
  translateY: true,
  scale: true,
  scaleX: true,
  scaleY: true,
  rotate: true,
  rotateX: true,
  rotateY: true,
  rotateZ: true,
  perspective: true,
  skewX: true,
  skewY: true,
  matrix: ReactNativeFeatureFlags.shouldUseAnimatedObjectForTransform(),
};

const SUPPORTED_INTERPOLATION_PARAMS: {[string]: boolean} = {
  inputRange: true,
  outputRange: true,
  extrapolate: true,
  extrapolateRight: true,
  extrapolateLeft: true,
};

export function allowInterpolationParam(param: string): void {
  SUPPORTED_INTERPOLATION_PARAMS[param] = true;
}

export function allowStyleProp(prop: string): void {
  SUPPORTED_STYLES[prop] = true;
}

export function allowTransformProp(prop: string): void {
  SUPPORTED_TRANSFORMS[prop] = true;
}

export function isSupportedColorStyleProp(prop: string): boolean {
  return SUPPORTED_COLOR_STYLES[prop] === true;
}

export function isSupportedInterpolationParam(param: string): boolean {
  return SUPPORTED_INTERPOLATION_PARAMS[param] === true;
}

export function isSupportedStyleProp(prop: string): boolean {
  return SUPPORTED_STYLES[prop] === true;
}

export function isSupportedTransformProp(prop: string): boolean {
  return SUPPORTED_TRANSFORMS[prop] === true;
}
