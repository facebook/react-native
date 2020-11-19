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
    /* $FlowFixMe(>=0.122.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.122.0 was deployed. To see the error, delete
     * this comment and run Flow. */
    bubblingEventTypes: {
      ...ReactNativeViewViewConfig.bubblingEventTypes,
      ...(viewConfig.bubblingEventTypes || {}),
    },
    /* $FlowFixMe(>=0.122.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.122.0 was deployed. To see the error, delete
     * this comment and run Flow. */
    directEventTypes: {
      ...ReactNativeViewViewConfig.directEventTypes,
      ...(viewConfig.directEventTypes || {}),
    },
    /* $FlowFixMe(>=0.122.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.122.0 was deployed. To see the error, delete
     * this comment and run Flow. */
    validAttributes: {
      ...ReactNativeViewViewConfig.validAttributes,
      ...(viewConfig.validAttributes || {}),
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
