
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const ReactNativeViewConfigRegistry = require('../../Renderer/shims/ReactNativeViewConfigRegistry');
const ReactNativeViewViewConfig = require('../View/ReactNativeViewViewConfig');
const verifyComponentAttributeEquivalence = require('../../Utilities/verifyComponentAttributeEquivalence');

const SliderViewConfig = {
  uiViewClassName: 'RCTSlider',
  Commands: {},

  bubblingEventTypes: {
    ...ReactNativeViewViewConfig.bubblingEventTypes,

    topChange: {
      phasedRegistrationNames: {
        captured: 'onChangeCapture',
        bubbled: 'onChange',
      },
    },

    topValueChange: {
      phasedRegistrationNames: {
        captured: 'onValueChangeCapture',
        bubbled: 'onValueChange',
      },
    },
  },

  directEventTypes: {
    ...ReactNativeViewViewConfig.directEventTypes,

    topSlidingComplete: {
      registrationName: 'onSlidingComplete',
    },
  },

  validAttributes: {
    ...ReactNativeViewViewConfig.validAttributes,
    disabled: true,
    enabled: true,
    maximumTrackImage: { process: require('../../Image/resolveAssetSource') },
    maximumTrackTintColor: { process: require('../../StyleSheet/processColor') },
    maximumValue: true,
    minimumTrackImage: { process: require('../../Image/resolveAssetSource') },
    minimumTrackTintColor: { process: require('../../StyleSheet/processColor') },
    minimumValue: true,
    step: true,
    testID: true,
    thumbImage: { process: require('../../Image/resolveAssetSource') },
    thumbTintColor: { process: require('../../StyleSheet/processColor') },
    trackImage: { process: require('../../Image/resolveAssetSource') },
    value: true,
    onChange: true,
    onValueChange: true,
    onSlidingComplete: true,
  },
};

verifyComponentAttributeEquivalence('RCTSlider', SliderViewConfig);

ReactNativeViewConfigRegistry.register(
  'RCTSlider',
  () => SliderViewConfig,
);

module.exports = 'RCTSlider'; // RCT prefix present for paper support
