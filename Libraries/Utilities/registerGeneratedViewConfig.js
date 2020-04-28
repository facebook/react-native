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

const ReactNativeViewConfigRegistry = require('../Renderer/shims/ReactNativeViewConfigRegistry');
const ReactNativeViewViewConfig = require('../Components/View/ReactNativeViewViewConfig');
import verifyComponentAttributeEquivalence from './verifyComponentAttributeEquivalence';

type GeneratedViewConfig = {
  uiViewClassName: string,
  bubblingEventTypes?: $ReadOnly<{
    [eventName: string]: $ReadOnly<{|
      phasedRegistrationNames: $ReadOnly<{|
        captured: string,
        bubbled: string,
      |}>,
    |}>,
  }>,
  directEventTypes?: $ReadOnly<{
    [eventName: string]: $ReadOnly<{|
      registrationName: string,
    |}>,
  }>,
  validAttributes?: {
    [propName: string]:
      | true
      | $ReadOnly<{|
          diff?: <T>(arg1: any, arg2: any) => boolean,
          process?: (arg1: any) => any,
        |}>,
  },
};

function registerGeneratedViewConfig(
  componentName: string,
  viewConfig: GeneratedViewConfig,
) {
  const mergedViewConfig = {
    uiViewClassName: componentName,
    Commands: {},
    bubblingEventTypes: {
      ...ReactNativeViewViewConfig.bubblingEventTypes,
      ...(viewConfig.bubblingEventTypes || {}),
    },
    directEventTypes: {
      ...ReactNativeViewViewConfig.directEventTypes,
      ...(viewConfig.directEventTypes || {}),
    },
    validAttributes: {
      ...ReactNativeViewViewConfig.validAttributes,
      ...(viewConfig.validAttributes || {}),
    },
  };

  ReactNativeViewConfigRegistry.register(componentName, () => {
    verifyComponentAttributeEquivalence(componentName, mergedViewConfig);

    return mergedViewConfig;
  });
}

module.exports = registerGeneratedViewConfig;
