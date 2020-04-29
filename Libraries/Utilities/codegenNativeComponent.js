/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
<<<<<<< HEAD
=======

>>>>>>> fb/0.62-stable
// TODO: move this file to shims/ReactNative (requires React update and sync)

'use strict';

<<<<<<< HEAD
import type {NativeComponent} from '../../Libraries/Renderer/shims/ReactNative';
import requireNativeComponent from '../../Libraries/ReactNative/requireNativeComponent';
import {UIManager} from 'react-native';
=======
import requireNativeComponent from '../../Libraries/ReactNative/requireNativeComponent';
import type {HostComponent} from '../../Libraries/Renderer/shims/ReactNativeTypes';
import UIManager from '../ReactNative/UIManager';
>>>>>>> fb/0.62-stable

// TODO: import from CodegenSchema once workspaces are enabled
type Options = $ReadOnly<{|
  interfaceOnly?: boolean,
  paperComponentName?: string,
  paperComponentNameDeprecated?: string,
<<<<<<< HEAD
|}>;

export type NativeComponentType<T> = Class<NativeComponent<T>>;
=======
  excludedPlatform?: 'iOS' | 'android',
|}>;

export type NativeComponentType<T> = HostComponent<T>;
>>>>>>> fb/0.62-stable

function codegenNativeComponent<Props>(
  componentName: string,
  options?: Options,
): NativeComponentType<Props> {
  let componentNameInUse =
    options && options.paperComponentName
      ? options.paperComponentName
      : componentName;

  if (options != null && options.paperComponentNameDeprecated != null) {
    if (UIManager.getViewManagerConfig(componentName)) {
      componentNameInUse = componentName;
    } else if (
      options.paperComponentNameDeprecated != null &&
      UIManager.getViewManagerConfig(options.paperComponentNameDeprecated)
    ) {
      componentNameInUse = options.paperComponentNameDeprecated;
    } else {
      throw new Error(
        `Failed to find native component for either ${componentName} or ${options.paperComponentNameDeprecated ||
          '(unknown)'}`,
      );
    }
  }

  // If this function is run at runtime then that means the view configs were not
  // generated with the view config babel plugin, so we need to require the native component.
  //
  // This will be useful during migration, but eventually this will error.
<<<<<<< HEAD
  return ((requireNativeComponent(componentNameInUse): any): Class<
    NativeComponent<Props>,
  >);
=======
  return (requireNativeComponent<Props>(
    componentNameInUse,
  ): HostComponent<Props>);
>>>>>>> fb/0.62-stable
}

export default codegenNativeComponent;
