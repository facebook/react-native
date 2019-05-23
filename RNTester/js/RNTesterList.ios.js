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
    supportsTVOS: true,
  },
  {
    key: 'ARTExample',
    module: require('./examples/ARTExample'),
    supportsTVOS: true,
  },
  {
    key: 'ButtonExample',
    module: require('./examples/ButtonExample'),
    supportsTVOS: true,
  },
  {
    key: 'DatePickerIOSExample',
    module: require('./examples/DatePickerIOSExample'),
    supportsTVOS: false,
  },
  {
    key: 'FlatListExample',
    module: require('./examples/FlatListExample'),
    supportsTVOS: true,
  },
  {
    key: 'ImageExample',
    module: require('./examples/ImageExample'),
    supportsTVOS: true,
  },
  {
    key: 'InputAccessoryViewExample',
    module: require('./examples/InputAccessoryViewExample'),
    supportsTVOS: true,
  },
  {
    key: 'KeyboardAvoidingViewExample',
    module: require('./examples/KeyboardAvoidingViewExample'),
    supportsTVOS: false,
  },
  {
    key: 'LayoutEventsExample',
    module: require('./examples/LayoutEventsExample'),
    supportsTVOS: true,
  },
  {
    key: 'MaskedViewExample',
    module: require('./examples/MaskedViewExample'),
    supportsTVOS: true,
  },
  {
    key: 'ModalExample',
    module: require('./examples/ModalExample'),
    supportsTVOS: true,
  },
  {
    key: 'MultiColumnExample',
    module: require('./examples/MultiColumnExample'),
    supportsTVOS: true,
  },
  {
    key: 'NewAppScreenExample',
    module: require('./examples/NewAppScreenExample'),
    supportsTVOS: false,
  },
  {
    key: 'PickerExample',
    module: require('./examples/PickerExample'),
    supportsTVOS: false,
  },
  {
    key: 'PickerIOSExample',
    module: require('./examples/PickerIOSExample'),
    supportsTVOS: false,
  },
  {
    key: 'ProgressViewIOSExample',
    module: require('./examples/ProgressViewIOSExample'),
    supportsTVOS: true,
  },
  {
    key: 'RefreshControlExample',
    module: require('./examples/RefreshControlExample'),
    supportsTVOS: false,
  },
  {
    key: 'ScrollViewSimpleExample',
    module: require('./examples/ScrollViewSimpleExample'),
    supportsTVOS: true,
  },
  {
    key: 'SafeAreaViewExample',
    module: require('./examples/SafeAreaViewExample'),
    supportsTVOS: true,
  },
  {
    key: 'ScrollViewExample',
    module: require('./examples/ScrollViewExample'),
    supportsTVOS: true,
  },
  {
    key: 'SectionListExample',
    module: require('./examples/SectionListExample'),
    supportsTVOS: true,
  },
  {
    key: 'SegmentedControlIOSExample',
    module: require('./examples/SegmentedControlIOSExample'),
    supportsTVOS: false,
  },
  {
    key: 'SliderExample',
    module: require('./examples/SliderExample'),
    supportsTVOS: false,
  },
  {
    key: 'StatusBarExample',
    module: require('./examples/StatusBarExample'),
    supportsTVOS: false,
  },
  {
    key: 'SwitchExample',
    module: require('./examples/SwitchExample'),
    supportsTVOS: false,
  },
  {
    key: 'TextExample',
    module: require('./examples/TextExample.ios'),
    supportsTVOS: true,
  },
  {
    key: 'TextInputExample',
    module: require('./examples/TextInputExample.ios'),
    supportsTVOS: true,
  },
  {
    key: 'TouchableExample',
    module: require('./examples/TouchableExample'),
    supportsTVOS: true,
  },
  {
    key: 'TransparentHitTestExample',
    module: require('./examples/TransparentHitTestExample'),
    supportsTVOS: false,
  },
  {
    key: 'ViewExample',
    module: require('./examples/ViewExample'),
    supportsTVOS: true,
  },
];

const APIExamples: Array<RNTesterExample> = [
  {
    key: 'AccessibilityExample',
    module: require('./examples/AccessibilityExample'),
    supportsTVOS: false,
  },
  {
    key: 'AccessibilityIOSExample',
    module: require('./examples/AccessibilityIOSExample'),
    supportsTVOS: false,
  },
  {
    key: 'ActionSheetIOSExample',
    module: require('./examples/ActionSheetIOSExample'),
    supportsTVOS: true,
  },
  {
    key: 'AlertIOSExample',
    module: require('./examples/AlertIOSExample'),
    supportsTVOS: true,
  },
  {
    key: 'AnimatedExample',
    module: require('./examples/AnimatedExample'),
    supportsTVOS: true,
  },
  {
    key: 'AnExApp',
    module: require('./AnimatedGratuitousApp/AnExApp'),
    supportsTVOS: true,
  },
  {
    key: 'AppStateExample',
    module: require('./examples/AppStateExample'),
    supportsTVOS: true,
  },
  {
    key: 'AsyncStorageExample',
    module: require('./examples/AsyncStorageExample'),
    supportsTVOS: true,
  },
  {
    key: 'BorderExample',
    module: require('./examples/BorderExample'),
    supportsTVOS: true,
  },
  {
    key: 'BoxShadowExample',
    module: require('./examples/BoxShadowExample'),
    supportsTVOS: true,
  },
  {
    key: 'ClipboardExample',
    module: require('./examples/ClipboardExample'),
    supportsTVOS: false,
  },
  {
    key: 'CrashExample',
    module: require('./examples/CrashExample'),
    supportsTVOS: false,
  },
  {
    key: 'Dimensions',
    module: require('./examples/DimensionsExample'),
    supportsTVOS: true,
  },
  {
    key: 'LayoutAnimationExample',
    module: require('./examples/LayoutAnimationExample'),
    supportsTVOS: true,
  },
  {
    key: 'LayoutExample',
    module: require('./examples/LayoutExample'),
    supportsTVOS: true,
  },
  {
    key: 'LinkingExample',
    module: require('./examples/LinkingExample'),
    supportsTVOS: true,
  },
  {
    key: 'NativeAnimationsExample',
    module: require('./examples/NativeAnimationsExample'),
    supportsTVOS: true,
  },
  {
    key: 'OrientationChangeExample',
    module: require('./examples/OrientationChangeExample'),
    supportsTVOS: false,
  },
  {
    key: 'PanResponderExample',
    module: require('./examples/PanResponderExample'),
    supportsTVOS: false,
  },
  {
    key: 'PointerEventsExample',
    module: require('./examples/PointerEventsExample'),
    supportsTVOS: false,
  },
  {
    key: 'PushNotificationIOSExample',
    module: require('./examples/PushNotificationIOSExample'),
    supportsTVOS: false,
  },
  {
    key: 'RCTRootViewIOSExample',
    module: require('./examples/RCTRootViewIOSExample'),
    supportsTVOS: true,
  },
  {
    key: 'RTLExample',
    module: require('./examples/RTLExample'),
    supportsTVOS: true,
  },
  {
    key: 'ShareExample',
    module: require('./examples/ShareExample'),
    supportsTVOS: true,
  },
  {
    key: 'SnapshotExample',
    module: require('./examples/SnapshotExample'),
    supportsTVOS: true,
  },
  {
    key: 'TimerExample',
    module: require('./examples/TimerExample'),
    supportsTVOS: true,
  },
  {
    key: 'TransformExample',
    module: require('./examples/TransformExample'),
    supportsTVOS: true,
  },
  {
    key: 'TurboModuleExample',
    module: require('./examples/TurboModuleExample'),
    supportsTVOS: false,
  },
  {
    key: 'TVEventHandlerExample',
    module: require('./examples/TVEventHandlerExample'),
    supportsTVOS: true,
  },
  {
    key: 'VibrationExample',
    module: require('./examples/VibrationExample'),
    supportsTVOS: false,
  },
  {
    key: 'WebSocketExample',
    module: require('./examples/WebSocketExample'),
    supportsTVOS: true,
  },
  {
    key: 'XHRExample',
    module: require('./examples/XHRExample'),
    supportsTVOS: true,
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
