/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {nativeComponentRegistryHasComponent} from '../../src/private/runtime/ReactNativeRuntimeGlobals';

let componentNameToExists: Map<string, boolean> = new Map();

/**
 * Unstable API. Do not use!
 *
 * This method returns if the component with name received as a parameter
 * is registered in the native platform.
 */
export function unstable_hasComponent(name: string): boolean {
  let hasComponent = componentNameToExists.get(name);
  if (hasComponent == null) {
    if (nativeComponentRegistryHasComponent != null) {
      hasComponent = nativeComponentRegistryHasComponent(name);
      componentNameToExists.set(name, hasComponent);
    } else {
      throw new Error(
        `unstable_hasComponent('${name}'): Global function is not registered`,
      );
    }
  }
  return hasComponent;
}
