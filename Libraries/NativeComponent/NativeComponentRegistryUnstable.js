/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

let componentNameToExists: Map<string, boolean> = new Map();

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
