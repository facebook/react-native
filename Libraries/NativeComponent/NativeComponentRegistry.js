/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import {createViewConfig} from './ViewConfig';
import type {
  HostComponent,
  PartialViewConfig,
} from '../Renderer/shims/ReactNativeTypes';
import ReactNativeViewConfigRegistry from '../Renderer/shims/ReactNativeViewConfigRegistry';
import getNativeComponentAttributes from '../ReactNative/getNativeComponentAttributes';
import verifyComponentAttributeEquivalence from '../Utilities/verifyComponentAttributeEquivalence';
import invariant from 'invariant';

let getRuntimeConfig;

/**
 * Configures a function that is called to determine whether a given component
 * should be registered using reflection of the native component at runtime.
 */
export function setRuntimeConfigProvider(
  runtimeConfigProvider: (name: string) => {native: boolean, verify: boolean},
): void {
  invariant(
    getRuntimeConfig == null,
    'NativeComponentRegistry.setRuntimeConfigProvider() called more than once.',
  );
  getRuntimeConfig = runtimeConfigProvider;
}

/**
 * Gets a `NativeComponent` that can be rendered by React Native.
 *
 * The supplied `viewConfigProvider` may or may not be invoked and utilized,
 * depending on how `setRuntimeConfigProvider` is configured.
 */
export function get<Config>(
  name: string,
  viewConfigProvider: () => PartialViewConfig,
): HostComponent<Config> {
  ReactNativeViewConfigRegistry.register(name, () => {
    const {native, verify} = getRuntimeConfig?.(name) ?? {
      native: true,
      verify: false,
    };

    const viewConfig = native
      ? getNativeComponentAttributes(name)
      : createViewConfig(viewConfigProvider());

    if (verify) {
      if (native) {
        verifyComponentAttributeEquivalence(
          viewConfig,
          createViewConfig(viewConfigProvider()),
        );
      } else {
        verifyComponentAttributeEquivalence(
          getNativeComponentAttributes(name),
          viewConfig,
        );
      }
    }

    return viewConfig;
  });

  // $FlowFixMe[incompatible-return] `NativeComponent` is actually string!
  return name;
}
