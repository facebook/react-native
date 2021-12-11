/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const ignoredViewConfigProps = new WeakSet<{...}>();

/**
 * Decorates ViewConfig values that are dynamically injected by the library,
 * react-native-gesture-handler. (T45765076)
 */
export function DynamicallyInjectedByGestureHandler<T: {...}>(object: T): T {
  ignoredViewConfigProps.add(object);
  return object;
}

export function isIgnored(value: mixed): boolean {
  if (typeof value === 'object' && value != null) {
    return ignoredViewConfigProps.has(value);
  }
  return false;
}
