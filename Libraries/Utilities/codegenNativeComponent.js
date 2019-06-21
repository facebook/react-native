/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
// TODO: move this file to shims/ReactNative (requires React update and sync)

'use strict';

import type {NativeComponent} from '../../Libraries/Renderer/shims/ReactNative';
import requireNativeComponent from '../../Libraries/ReactNative/requireNativeComponent';
import {UIManager} from 'react-native';

// TODO: import from CodegenSchema once workspaces are enabled
type Options = $ReadOnly<{|
  interfaceOnly?: boolean,
  paperComponentName?: string,
  paperComponentNameDeprecated?: string,
|}>;

function codegenNativeComponent<Props>(
  componentName: string,
  options?: Options,
): Class<NativeComponent<Props>> {
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
        'Failed to find native component for either "::_COMPONENT_NAME_::" or "::_COMPONENT_NAME_DEPRECATED_::"',
      );
    }
  }

  // If this function is run at runtime then that means the view configs were not
  // generated with the view config babel plugin, so we need to require the native component.
  //
  // This will be useful during migration, but eventually this will error.
  return ((requireNativeComponent(componentNameInUse): any): Class<
    NativeComponent<Props>,
  >);
}

export default codegenNativeComponent;
