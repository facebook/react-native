/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {createViewConfig} from './ViewConfig';
import UIManager from '../ReactNative/UIManager';
import type {
  HostComponent,
  PartialViewConfig,
} from '../Renderer/shims/ReactNativeTypes';
import ReactNativeViewConfigRegistry from '../Renderer/shims/ReactNativeViewConfigRegistry';
import getNativeComponentAttributes from '../ReactNative/getNativeComponentAttributes';
import verifyComponentAttributeEquivalence from '../Utilities/verifyComponentAttributeEquivalence';
import invariant from 'invariant';
import * as React from 'react';

let getRuntimeConfig;

let componentNameToExists: Map<string, boolean> = new Map();

/**
 * Configures a function that is called to determine whether a given component
 * should be registered using reflection of the native component at runtime.
 *
 * The provider should return null if the native component is unavailable in
 * the current environment.
 */
export function setRuntimeConfigProvider(
  runtimeConfigProvider: (
    name: string,
  ) => ?{
    native: boolean,
    verify: boolean,
  },
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

/**
 * Same as `NativeComponentRegistry.get(...)`, except this will check either
 * the `setRuntimeConfigProvider` configuration or use native reflection (slow)
 * to determine whether this native component is available.
 *
 * If the native component is not available, a stub component is returned. Note
 * that the return value of this is not `HostComponent` because the returned
 * component instance is not guaranteed to have native methods.
 */
export function getWithFallback_DEPRECATED<Config>(
  name: string,
  viewConfigProvider: () => PartialViewConfig,
): React.AbstractComponent<Config> {
  if (getRuntimeConfig == null) {
    // If `setRuntimeConfigProvider` is not configured, use native reflection.
    if (hasNativeViewConfig(name)) {
      return get<Config>(name, viewConfigProvider);
    }
  } else {
    // If there is no runtime config, then the native component is unavailable.
    if (getRuntimeConfig(name) != null) {
      return get<Config>(name, viewConfigProvider);
    }
  }

  const FallbackNativeComponent = function(props: Config): React.Node {
    return null;
  };
  FallbackNativeComponent.displayName = `Fallback(${name})`;
  return FallbackNativeComponent;
}

function hasNativeViewConfig(name: string): boolean {
  invariant(getRuntimeConfig == null, 'Unexpected invocation!');
  return UIManager.getViewManagerConfig(name) != null;
}

/**
 * Unstable API. Do not use!
 *
 * This method returns if there is a StaticViewConfig registered for the
 * component name received as a parameter.
 */
export function unstable_hasStaticViewConfig(name: string): boolean {
  const {native} = getRuntimeConfig?.(name) ?? {
    native: true,
  };
  return !native;
}

/**
 * Unstable API. Do not use!
 *
 * This method returns if the component with name received as a parameter
 * is registed in the native platform.
 */
export function unstable_hasComponent(name: string): boolean {
  let hasNativeComponent = componentNameToExists.get(name);
  if (hasNativeComponent == null) {
    if (global.__nativeComponentRegistry__hasComponent) {
      hasNativeComponent = global.__nativeComponentRegistry__hasComponent(name);
      componentNameToExists.set(name, hasNativeComponent);
    } else {
      throw `unstable_hasComponent('${name}'): Global function is not registered`;
    }
  }
  return hasNativeComponent;
}
