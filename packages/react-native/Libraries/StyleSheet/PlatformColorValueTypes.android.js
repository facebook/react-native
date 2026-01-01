/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ProcessedColorValue} from './processColor';
import type {NativeColorValue} from './StyleSheet';

/** The actual type of the opaque NativeColorValue on Android platform */
type LocalNativeColorValue = {
  resource_paths?: Array<string>,
};

/**
 * Creates a builder proxy with no-op methods for cross-platform compatibility.
 * On Android, alpha/prominence/contentHeadroom are iOS-specific and have no effect.
 */
function createPlatformColorBuilder(
  data: LocalNativeColorValue,
): NativeColorValue {
  const handler = {
    get(
      target: LocalNativeColorValue,
      prop: string,
    ): mixed {
      // No-op builder methods for cross-platform compatibility
      // Return the builder function only if the property hasn't been set yet
      if (prop === 'alpha' || prop === 'prominence' || prop === 'contentHeadroom') {
        if (prop in target) {
          // $FlowFixMe[incompatible-return]
          return target[prop];
        }
        return (_value: mixed): NativeColorValue => {
          // On Android, these modifiers have no effect - just return the same proxy
          return new Proxy(target, handler);
        };
      }
      // $FlowFixMe[incompatible-return]
      return target[prop];
    },
    has(target: LocalNativeColorValue, prop: string): boolean {
      return prop in target;
    },
    ownKeys(target: LocalNativeColorValue): Array<string> {
      return Object.keys(target);
    },
    getOwnPropertyDescriptor(
      target: LocalNativeColorValue,
      prop: string,
    ): ?{value: mixed, writable: boolean, enumerable: boolean, configurable: boolean} {
      return Object.getOwnPropertyDescriptor(target, prop);
    },
  };

  // $FlowExpectedError[incompatible-return] Proxy is compatible with NativeColorValue
  return new Proxy(data, handler);
}

export const PlatformColor = (...names: Array<string>): NativeColorValue => {
  const data: LocalNativeColorValue = {resource_paths: names};
  return createPlatformColorBuilder(data);
};

export const normalizeColorObject = (
  color: NativeColorValue,
): ?ProcessedColorValue => {
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on Android platform */
  if ('resource_paths' in (color: LocalNativeColorValue)) {
    return color;
  }
  return null;
};

export const processColorObject = (
  color: NativeColorValue,
): ?NativeColorValue => {
  return color;
};
