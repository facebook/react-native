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

/**
 * Aliases that can be blocked from inlining for aeshetic and
 * readability reasons.
 */
export const aliasInliningBlocklist: Set<string> = new Set([
  'AlertOptions',
  'Runnable',
  'DimensionsPayload',
  'DisplayMetrics',
  'DisplayMetricsAndroid',
  'NativeTouchEvent',
  'State',
  'WithAnimatedValue',
]);

/**
 * Aliases that can be blocked from inlining recursively for aeshetic and
 * readability reasons.
 */
export const aliasInliningBlocklistRecursive: Set<string> = new Set([
  'AnimatedComponentType',
  'AnimatedProps',
]);

/**
 * Aliases that can be forced to inline despite the reference limit.
 */
export const aliasInlineDespiteReferenceLimit: Set<string> = new Set([
  'ViewProps',
]);

/**
 * The maximum number of references an alias can have to be inlined.
 */
export const MAX_ALIAS_REFERENCES_FOR_INLINING = 20;
