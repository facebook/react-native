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
    module: require('./ActivityIndicatorExample'),
  },
  {
    key: 'ButtonExample',
    module: require('./ButtonExample'),
  },
  {
    key: 'CheckBoxExample',
    module: require('./CheckBoxExample'),
  },
  {
    key: 'FlatListExample',
    module: require('./FlatListExample'),
  },
  {
    key: 'ImageExample',
    module: require('./ImageExample'),
  },
  {
    key: 'ModalExample',
    module: require('./ModalExample'),
  },
  {
    key: 'MultiColumnExample',
    module: require('./MultiColumnExample'),
  },
  {
    key: 'NewAppScreenExample',
    module: require('./NewAppScreenExample'),
  },
  {
    key: 'PickerExample',
    module: require('./PickerExample'),
  },
  {
    key: 'ProgressBarAndroidExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./ProgressBarAndroidExample'),
  },
  {
    key: 'RefreshControlExample',
    module: require('./RefreshControlExample'),
  },
  {
    key: 'ScrollViewSimpleExample',
    module: require('./ScrollViewSimpleExample'),
  },
  {
    key: 'SectionListExample',
    module: require('./SectionListExample'),
  },
  {
    key: 'SliderExample',
    module: require('./SliderExample'),
  },
  {
    key: 'StatusBarExample',
    module: require('./StatusBarExample'),
  },
  {
    key: 'SwitchExample',
    module: require('./SwitchExample'),
  },
  {
    key: 'TextExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./TextExample'),
  },
  {
    key: 'TextInputExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./TextInputExample'),
  },
  {
    key: 'ToolbarAndroidExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./ToolbarAndroidExample'),
  },
  {
    key: 'TouchableExample',
    module: require('./TouchableExample'),
  },
  {
    key: 'ViewExample',
    module: require('./ViewExample'),
  },
  {
    key: 'ViewPagerAndroidExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./ViewPagerAndroidExample'),
  },
];

const APIExamples: Array<RNTesterExample> = [
  {
    key: 'AccessibilityExample',
    module: require('./AccessibilityExample'),
  },
  {
    key: 'AccessibilityAndroidExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./AccessibilityAndroidExample'),
  },
  {
    key: 'AlertExample',
    module: require('./AlertExample').AlertExample,
  },
  {
    key: 'AnimatedExample',
    module: require('./AnimatedExample'),
  },
  {
    key: 'AppStateExample',
    module: require('./AppStateExample'),
  },
  {
    key: 'BorderExample',
    module: require('./BorderExample'),
  },
  {
    key: 'CameraRollExample',
    module: require('./CameraRollExample'),
  },
  {
    key: 'ClipboardExample',
    module: require('./ClipboardExample'),
  },
  {
    key: 'CrashExample',
    module: require('./CrashExample'),
  },
  {
    key: 'DatePickerAndroidExample',
    module: require('./DatePickerAndroidExample'),
  },
  {
    key: 'Dimensions',
    module: require('./DimensionsExample'),
  },
  {
    key: 'ImageEditingExample',
    module: require('./ImageEditingExample'),
  },
  {
    key: 'LayoutEventsExample',
    module: require('./LayoutEventsExample'),
  },
  {
    key: 'LinkingExample',
    module: require('./LinkingExample'),
  },
  {
    key: 'LayoutAnimationExample',
    module: require('./LayoutAnimationExample'),
  },
  {
    key: 'LayoutExample',
    module: require('./LayoutExample'),
  },
  {
    key: 'NativeAnimationsExample',
    module: require('./NativeAnimationsExample'),
  },
  {
    key: 'OrientationChangeExample',
    module: require('./OrientationChangeExample'),
  },
  {
    key: 'PanResponderExample',
    module: require('./PanResponderExample'),
  },
  {
    key: 'PermissionsExampleAndroid',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./PermissionsExampleAndroid'),
  },
  {
    key: 'PointerEventsExample',
    module: require('./PointerEventsExample'),
  },
  {
    key: 'RTLExample',
    module: require('./RTLExample'),
  },
  {
    key: 'ShareExample',
    module: require('./ShareExample'),
  },
  {
    key: 'TimePickerAndroidExample',
    module: require('./TimePickerAndroidExample'),
  },
  {
    key: 'TimerExample',
    module: require('./TimerExample'),
  },
  {
    key: 'ToastAndroidExample',
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    module: require('./ToastAndroidExample'),
  },
  {
    key: 'TransformExample',
    module: require('./TransformExample'),
  },
  {
    key: 'VibrationExample',
    module: require('./VibrationExample'),
  },
  {
    key: 'WebSocketExample',
    module: require('./WebSocketExample'),
  },
  {
    key: 'XHRExample',
    module: require('./XHRExample'),
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
