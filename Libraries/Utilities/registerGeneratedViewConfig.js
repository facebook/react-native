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

<<<<<<< HEAD
type GeneratedViewConfig = {
=======
export type GeneratedViewConfig = {
>>>>>>> fb/0.62-stable
  uiViewClassName: string,
  bubblingEventTypes?: $ReadOnly<{
    [eventName: string]: $ReadOnly<{|
      phasedRegistrationNames: $ReadOnly<{|
        captured: string,
        bubbled: string,
      |}>,
    |}>,
<<<<<<< HEAD
=======
    ...,
>>>>>>> fb/0.62-stable
  }>,
  directEventTypes?: $ReadOnly<{
    [eventName: string]: $ReadOnly<{|
      registrationName: string,
    |}>,
<<<<<<< HEAD
=======
    ...,
>>>>>>> fb/0.62-stable
  }>,
  validAttributes?: {
    [propName: string]:
      | true
      | $ReadOnly<{|
          diff?: <T>(arg1: any, arg2: any) => boolean,
          process?: (arg1: any) => any,
        |}>,
<<<<<<< HEAD
  },
=======
    ...,
  },
  ...
>>>>>>> fb/0.62-stable
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
<<<<<<< HEAD
=======
      /* $FlowFixMe(>=0.111.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.111 was deployed. To see the error, delete
       * this comment and run Flow. */
>>>>>>> fb/0.62-stable
      ...(viewConfig.bubblingEventTypes || {}),
    },
    directEventTypes: {
      ...ReactNativeViewViewConfig.directEventTypes,
<<<<<<< HEAD
=======
      /* $FlowFixMe(>=0.111.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.111 was deployed. To see the error, delete
       * this comment and run Flow. */
>>>>>>> fb/0.62-stable
      ...(viewConfig.directEventTypes || {}),
    },
    validAttributes: {
      ...ReactNativeViewViewConfig.validAttributes,
<<<<<<< HEAD
=======
      /* $FlowFixMe(>=0.111.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.111 was deployed. To see the error, delete
       * this comment and run Flow. */
>>>>>>> fb/0.62-stable
      ...(viewConfig.validAttributes || {}),
    },
  };

  ReactNativeViewConfigRegistry.register(componentName, () => {
    verifyComponentAttributeEquivalence(componentName, mergedViewConfig);

    return mergedViewConfig;
  });
}

module.exports = registerGeneratedViewConfig;
