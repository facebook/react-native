
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');
const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');

const ActivityIndicatorViewViewConfig = {
  uiViewClassName: 'ActivityIndicatorView',

  validAttributes: {
    hidesWhenStopped: true,
    animating: true,
    styleAttr: true,
    color: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ColorPrimitive,
    size: true,
    intermediate: true,
    style: ReactNativeStyleAttributes
  }
};

ReactNativeViewConfigRegistry.register(
  'ActivityIndicatorView',
  () => ActivityIndicatorViewViewConfig,
);

const SwitchViewConfig = {
  uiViewClassName: 'Switch',

  bubblingEventTypes: {
    onChange: {
      phasedRegistrationNames: {
        captured: 'onChangeCapture',
        bubbled: 'onChange'
      }
    }
  },

  validAttributes: {
    disabled: true,
    value: true,
    tintColor: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ColorPrimitive,
    onTintColor: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ColorPrimitive,
    thumbTintColor: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ColorPrimitive,
    style: ReactNativeStyleAttributes
  }
};

ReactNativeViewConfigRegistry.register(
  'Switch',
  () => SwitchViewConfig,
);

const SliderViewConfig = {
  uiViewClassName: 'Slider',

  bubblingEventTypes: {
    onChange: {
      phasedRegistrationNames: {
        captured: 'onChangeCapture',
        bubbled: 'onChange'
      }
    },

    onSlidingComplete: {
      phasedRegistrationNames: {
        captured: 'onSlidingCompleteCapture',
        bubbled: 'onSlidingComplete'
      }
    },

    onValueChange: {
      phasedRegistrationNames: {
        captured: 'onValueChangeCapture',
        bubbled: 'onValueChange'
      }
    }
  },

  validAttributes: {
    disabled: true,
    enabled: true,
    maximumTrackImage: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ImageSourcePrimitive,
    maximumTrackTintColor: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ColorPrimitive,
    maximumValue: true,
    minimumTrackImage: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ImageSourcePrimitive,
    minimumTrackTintColor: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ColorPrimitive,
    minimumValue: true,
    step: true,
    testID: true,
    thumbImage: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ImageSourcePrimitive,
    trackImage: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ImageSourcePrimitive,
    thumbTintColor: require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives.ColorPrimitive,
    value: true,
    style: ReactNativeStyleAttributes
  }
};

ReactNativeViewConfigRegistry.register(
  'Slider',
  () => SliderViewConfig,
);
