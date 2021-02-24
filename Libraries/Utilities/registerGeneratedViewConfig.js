/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {createViewConfig} from '../NativeComponent/ViewConfig';
import {type PartialViewConfig} from '../Renderer/shims/ReactNativeTypes';
import ReactNativeViewConfigRegistry from '../Renderer/shims/ReactNativeViewConfigRegistry';
import getNativeComponentAttributes from '../ReactNative/getNativeComponentAttributes';
import verifyComponentAttributeEquivalence from './verifyComponentAttributeEquivalence';

function registerGeneratedViewConfig(
  componentName: string,
  partialViewConfig: PartialViewConfig,
) {
  const staticViewConfig = createViewConfig(partialViewConfig);

  ReactNativeViewConfigRegistry.register(componentName, () => {
    if (!global.RN$Bridgeless) {
      const nativeViewConfig = getNativeComponentAttributes(componentName);

      verifyComponentAttributeEquivalence(nativeViewConfig, staticViewConfig);
    }

    return staticViewConfig;
  });
}

module.exports = registerGeneratedViewConfig;
