/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import {type PartialViewConfig} from '../Renderer/shims/ReactNativeTypes';
import ReactNativeViewConfigRegistry from '../Renderer/shims/ReactNativeViewConfigRegistry';
import ReactNativeViewViewConfig from '../Components/View/ReactNativeViewViewConfig';
import getNativeComponentAttributes from '../ReactNative/getNativeComponentAttributes';
import verifyComponentAttributeEquivalence from './verifyComponentAttributeEquivalence';

function registerGeneratedViewConfig(
  componentName: string,
  viewConfig: PartialViewConfig,
) {
  const staticViewConfig = {
    uiViewClassName: componentName,
    Commands: {},
    // $FlowFixMe[cannot-spread-indexer] Properties can be overridden.
    bubblingEventTypes: {
      ...ReactNativeViewViewConfig.bubblingEventTypes,
      ...(viewConfig.bubblingEventTypes ?? {}: $NonMaybeType<
        $PropertyType<PartialViewConfig, 'bubblingEventTypes'>,
      >),
    },
    // $FlowFixMe[cannot-spread-indexer] Properties can be overridden.
    directEventTypes: {
      ...ReactNativeViewViewConfig.directEventTypes,
      ...(viewConfig.directEventTypes ?? {}: $NonMaybeType<
        $PropertyType<PartialViewConfig, 'directEventTypes'>,
      >),
    },
    // $FlowFixMe[cannot-spread-indexer] Properties can be overridden.
    validAttributes: {
      ...ReactNativeViewViewConfig.validAttributes,
      ...(viewConfig.validAttributes ?? {}: $NonMaybeType<
        $PropertyType<PartialViewConfig, 'validAttributes'>,
      >),
    },
  };

  ReactNativeViewConfigRegistry.register(componentName, () => {
    if (!global.RN$Bridgeless) {
      const nativeViewConfig = getNativeComponentAttributes(componentName);

      verifyComponentAttributeEquivalence(nativeViewConfig, staticViewConfig);
    }

    return staticViewConfig;
  });
}

module.exports = registerGeneratedViewConfig;
