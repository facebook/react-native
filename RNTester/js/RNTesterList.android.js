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

import type {RNTesterExample} from './Shared/RNTesterTypes';

const ComponentExamples: Array<RNTesterExample> = [
  {
    key: 'ActivityIndicatorExample',
    module: require('./examples/ActivityIndicatorExample'),
  },
  {
    key: 'ButtonExample',
    module: require('./examples/ButtonExample'),
  },
  {
    key: 'CheckBoxExample',
    module: require('./examples/CheckBoxExample'),
  },
  {
    key: 'FlatListExample',
    module: require('./examples/FlatListExample'),
  },
  {
    key: 'ImageExample',
    module: require('./examples/ImageExample'),
  },
  {
    key: 'KeyboardAvoidingViewExample',
    module: require('./examples/KeyboardAvoidingViewExample'),
  },
  {
    key: 'ModalExample',
    module: require('./examples/ModalExample'),
  },
  {
    key: 'MultiColumnExample',
    module: require('./examples/MultiColumnExample'),
  },
  {
    key: 'NewAppScreenExample',
    module: require('./examples/NewAppScreenExample'),
  },
  {
    key: 'PickerExample',
    module: require('./examples/PickerExample'),
  },
  {
    key: 'ProgressBarAndroidExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./examples/ProgressBarAndroidExample'),
  },
  {
    key: 'RefreshControlExample',
    module: require('./examples/RefreshControlExample'),
  },
  {
    key: 'ScrollViewSimpleExample',
    module: require('./examples/ScrollViewSimpleExample'),
  },
  {
    key: 'SectionListExample',
    module: require('./examples/SectionListExample'),
  },
  {
    key: 'SliderExample',
    module: require('./examples/SliderExample'),
  },
  {
    key: 'StatusBarExample',
    module: require('./examples/StatusBarExample'),
  },
  {
    key: 'SwitchExample',
    module: require('./examples/SwitchExample'),
  },
  {
    key: 'TextExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./examples/TextExample'),
  },
  {
    key: 'TextInputExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./examples/TextInputExample'),
  },
  {
    key: 'TouchableExample',
    module: require('./examples/TouchableExample'),
  },
  {
    key: 'ViewExample',
    module: require('./examples/ViewExample'),
  },
  {
    key: 'ViewPagerAndroidExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./examples/ViewPagerAndroidExample'),
  },
];

const APIExamples: Array<RNTesterExample> = [
  {
    key: 'AccessibilityExample',
    module: require('./examples/AccessibilityExample'),
  },
  {
    key: 'AccessibilityAndroidExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./examples/AccessibilityAndroidExample'),
  },
  {
    key: 'AlertExample',
    module: require('./examples/AlertExample').AlertExample,
  },
  {
    key: 'AnimatedExample',
    module: require('./examples/AnimatedExample'),
  },
  {
    key: 'AppStateExample',
    module: require('./examples/AppStateExample'),
  },
  {
    key: 'BorderExample',
    module: require('./examples/BorderExample'),
  },
  {
    key: 'ClipboardExample',
    module: require('./examples/ClipboardExample'),
  },
  {
    key: 'CrashExample',
    module: require('./examples/CrashExample'),
  },
  {
    key: 'DatePickerAndroidExample',
    module: require('./examples/DatePickerAndroidExample'),
  },
  {
    key: 'Dimensions',
    module: require('./examples/DimensionsExample'),
  },
  {
    key: 'LayoutEventsExample',
    module: require('./examples/LayoutEventsExample'),
  },
  {
    key: 'LinkingExample',
    module: require('./examples/LinkingExample'),
  },
  {
    key: 'LayoutAnimationExample',
    module: require('./examples/LayoutAnimationExample'),
  },
  {
    key: 'LayoutExample',
    module: require('./examples/LayoutExample'),
  },
  {
    key: 'NativeAnimationsExample',
    module: require('./examples/NativeAnimationsExample'),
  },
  {
    key: 'OrientationChangeExample',
    module: require('./examples/OrientationChangeExample'),
  },
  {
    key: 'PanResponderExample',
    module: require('./examples/PanResponderExample'),
  },
  {
    key: 'PermissionsExampleAndroid',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./examples/PermissionsExampleAndroid'),
  },
  {
    key: 'PointerEventsExample',
    module: require('./examples/PointerEventsExample'),
  },
  {
    key: 'RTLExample',
    module: require('./examples/RTLExample'),
  },
  {
    key: 'ShareExample',
    module: require('./examples/ShareExample'),
  },
  {
    key: 'TimePickerAndroidExample',
    module: require('./examples/TimePickerAndroidExample'),
  },
  {
    key: 'TimerExample',
    module: require('./examples/TimerExample'),
  },
  {
    key: 'ToastAndroidExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./examples/ToastAndroidExample'),
  },
  {
    key: 'TransformExample',
    module: require('./examples/TransformExample'),
  },
  {
    key: 'VibrationExample',
    module: require('./examples/VibrationExample'),
  },
  {
    key: 'WebSocketExample',
    module: require('./examples/WebSocketExample'),
  },
  {
    key: 'XHRExample',
    module: require('./examples/XHRExample'),
  },
];

const Modules = {};

APIExamples.concat(ComponentExamples).forEach(Example => {
  Modules[Example.key] = Example.module;
});

const RNTesterList = {
  APIExamples,
  ComponentExamples,
  Modules,
};

module.exports = RNTesterList;
