
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');
const ReactNativeViewViewConfig = require('ReactNativeViewViewConfig');
const verifyComponentAttributeEquivalence = require('verifyComponentAttributeEquivalence');

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
    maximumTrackImage: { process: require('resolveAssetSource') },
    maximumTrackTintColor: { process: require('processColor') },
    maximumValue: true,
    minimumTrackImage: { process: require('resolveAssetSource') },
    minimumTrackTintColor: { process: require('processColor') },
    minimumValue: true,
    step: true,
    testID: true,
    thumbImage: { process: require('resolveAssetSource') },
    thumbTintColor: { process: require('processColor') },
    trackImage: { process: require('resolveAssetSource') },
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
