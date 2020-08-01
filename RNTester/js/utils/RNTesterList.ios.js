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

import type {RNTesterExample} from '../types/RNTesterTypes';

const ComponentExamples: Array<RNTesterExample> = [
  {
    key: 'ActivityIndicatorExample',
    module: require('../examples/ActivityIndicator/ActivityIndicatorExample'),
  },
  {
    key: 'ButtonExample',
    module: require('../examples/Button/ButtonExample'),
  },
  {
    key: 'DatePickerIOSExample',
    module: require('../examples/DatePicker/DatePickerIOSExample'),
  },
  {
    key: 'FlatListExample',
    module: require('../examples/FlatList/FlatListExample'),
  },
  {
    key: 'ImageExample',
    module: require('../examples/Image/ImageExample'),
  },
  {
    key: 'JSResponderHandlerExample',
    module: require('../examples/JSResponderHandlerExample/JSResponderHandlerExample'),
  },
  {
    key: 'InputAccessoryViewExample',
    module: require('../examples/InputAccessoryView/InputAccessoryViewExample'),
  },
  {
    key: 'KeyboardAvoidingViewExample',
    module: require('../examples/KeyboardAvoidingView/KeyboardAvoidingViewExample'),
  },
  {
    key: 'LayoutEventsExample',
    module: require('../examples/Layout/LayoutEventsExample'),
  },
  {
    key: 'MaskedViewExample',
    module: require('../examples/MaskedView/MaskedViewExample'),
  },
  {
    key: 'ModalExample',
    module: require('../examples/Modal/ModalExample'),
  },
  {
    key: 'MultiColumnExample',
    module: require('../examples/MultiColumn/MultiColumnExample'),
  },
  {
    key: 'NewAppScreenExample',
    module: require('../examples/NewAppScreen/NewAppScreenExample'),
  },
  {
    key: 'PickerExample',
    module: require('../examples/Picker/PickerExample'),
  },
  {
    key: 'PickerIOSExample',
    module: require('../examples/Picker/PickerIOSExample'),
  },
  {
    key: 'PressableExample',
    module: require('../examples/Pressable/PressableExample'),
  },
  {
    key: 'ProgressViewIOSExample',
    module: require('../examples/ProgressViewIOS/ProgressViewIOSExample'),
  },
  {
    key: 'RefreshControlExample',
    module: require('../examples/RefreshControl/RefreshControlExample'),
  },
  {
    key: 'ScrollViewSimpleExample',
    module: require('../examples/ScrollView/ScrollViewSimpleExample'),
  },
  {
    key: 'SafeAreaViewExample',
    module: require('../examples/SafeAreaView/SafeAreaViewExample'),
  },
  {
    key: 'ScrollViewExample',
    module: require('../examples/ScrollView/ScrollViewExample'),
  },
  {
    key: 'ScrollViewAnimatedExample',
    module: require('../examples/ScrollView/ScrollViewAnimatedExample'),
  },
  {
    key: 'SectionListExample',
    module: require('../examples/SectionList/SectionListExample'),
  },
  {
    key: 'SegmentedControlIOSExample',
    module: require('../examples/SegmentedControlIOS/SegmentedControlIOSExample'),
  },
  {
    key: 'SliderExample',
    module: require('../examples/Slider/SliderExample'),
  },
  {
    key: 'StatusBarExample',
    module: require('../examples/StatusBar/StatusBarExample'),
  },
  {
    key: 'SwitchExample',
    module: require('../examples/Switch/SwitchExample'),
  },
  {
    key: 'TextExample',
    module: require('../examples/Text/TextExample.ios'),
  },
  {
    key: 'TextInputExample',
    module: require('../examples/TextInput/TextInputExample.ios'),
  },
  {
    key: 'TouchableExample',
    module: require('../examples/Touchable/TouchableExample'),
  },
  {
    key: 'TransparentHitTestExample',
    module: require('../examples/TransparentHitTest/TransparentHitTestExample'),
  },
  {
    key: 'ViewExample',
    module: require('../examples/View/ViewExample'),
  },
];

const APIExamples: Array<RNTesterExample> = [
  {
    key: 'AccessibilityExample',
    module: require('../examples/Accessibility/AccessibilityExample'),
  },
  {
    key: 'AccessibilityIOSExample',
    module: require('../examples/Accessibility/AccessibilityIOSExample'),
  },
  {
    key: 'ActionSheetIOSExample',
    module: require('../examples/ActionSheetIOS/ActionSheetIOSExample'),
  },
  {
    key: 'AlertIOSExample',
    module: require('../examples/Alert/AlertIOSExample'),
  },
  {
    key: 'AnimatedExample',
    module: require('../examples/Animated/AnimatedExample'),
  },
  {
    key: 'AnExApp',
    module: require('../examples/Animated/AnimatedGratuitousApp/AnExApp'),
  },
  {
    key: 'AppearanceExample',
    module: require('../examples/Appearance/AppearanceExample'),
  },
  {
    key: 'AppStateExample',
    module: require('../examples/AppState/AppStateExample'),
  },
  {
    key: 'AsyncStorageExample',
    module: require('../examples/AsyncStorage/AsyncStorageExample'),
  },
  {
    key: 'BorderExample',
    module: require('../examples/Border/BorderExample'),
  },
  {
    key: 'BoxShadowExample',
    module: require('../examples/BoxShadow/BoxShadowExample'),
  },
  {
    key: 'ClipboardExample',
    module: require('../examples/Clipboard/ClipboardExample'),
  },
  {
    key: 'CrashExample',
    module: require('../examples/Crash/CrashExample'),
  },
  {
    key: 'DevSettings',
    module: require('../examples/DevSettings/DevSettingsExample'),
  },
  {
    key: 'Dimensions',
    module: require('../examples/Dimensions/DimensionsExample'),
  },
  {
    key: 'LayoutAnimationExample',
    module: require('../examples/Layout/LayoutAnimationExample'),
  },
  {
    key: 'LayoutExample',
    module: require('../examples/Layout/LayoutExample'),
  },
  {
    key: 'LinkingExample',
    module: require('../examples/Linking/LinkingExample'),
  },
  {
    key: 'NativeAnimationsExample',
    module: require('../examples/NativeAnimation/NativeAnimationsExample'),
  },
  {
    key: 'OrientationChangeExample',
    module: require('../examples/OrientationChange/OrientationChangeExample'),
  },
  {
    key: 'PanResponderExample',
    module: require('../examples/PanResponder/PanResponderExample'),
  },
  {
    key: 'PlatformColorExample',
    module: require('../examples/PlatformColor/PlatformColorExample'),
  },
  {
    key: 'PointerEventsExample',
    module: require('../examples/PointerEvents/PointerEventsExample'),
  },
  {
    key: 'PushNotificationIOSExample',
    module: require('../examples/PushNotificationIOS/PushNotificationIOSExample'),
  },
  {
    key: 'RCTRootViewIOSExample',
    module: require('../examples/RCTRootView/RCTRootViewIOSExample'),
  },
  {
    key: 'RTLExample',
    module: require('../examples/RTL/RTLExample'),
  },
  {
    key: 'ShareExample',
    module: require('../examples/Share/ShareExample'),
  },
  {
    key: 'SnapshotExample',
    module: require('../examples/Snapshot/SnapshotExample'),
  },
  {
    key: 'TimerExample',
    module: require('../examples/Timer/TimerExample'),
  },
  {
    key: 'TransformExample',
    module: require('../examples/Transform/TransformExample'),
  },
  {
    key: 'TurboModuleExample',
    module: require('../examples/TurboModule/TurboModuleExample'),
  },
  {
    key: 'TVEventHandlerExample',
    module: require('../examples/TVEventHandler/TVEventHandlerExample'),
  },
  {
    key: 'VibrationExample',
    module: require('../examples/Vibration/VibrationExample'),
  },
  {
    key: 'WebSocketExample',
    module: require('../examples/WebSocket/WebSocketExample'),
  },
  {
    key: 'XHRExample',
    module: require('../examples/XHR/XHRExample'),
  },
];

const Modules: {...} = {};

APIExamples.concat(ComponentExamples).forEach(Example => {
  Modules[Example.key] = Example.module;
});

const RNTesterList = {
  APIExamples,
  ComponentExamples,
  Modules,
};

module.exports = RNTesterList;
