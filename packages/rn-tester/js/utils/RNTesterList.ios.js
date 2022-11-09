/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {RNTesterModuleInfo} from '../types/RNTesterTypes';

import ReactNativeFeatureFlags from 'react-native/Libraries/ReactNative/ReactNativeFeatureFlags';

const Components: Array<RNTesterModuleInfo> = [
  {
    key: 'ActivityIndicatorExample',
    category: 'UI',
    module: require('../examples/ActivityIndicator/ActivityIndicatorExample'),
    supportsTVOS: true,
  },
  {
    key: 'ButtonExample',
    module: require('../examples/Button/ButtonExample'),
    category: 'UI',
    supportsTVOS: true,
  },
  {
    key: 'FlatListExampleIndex',
    module: require('../examples/FlatList/FlatListExampleIndex').default,
    category: 'ListView',
    supportsTVOS: true,
  },
  {
    key: 'ImageExample',
    module: require('../examples/Image/ImageExample'),
    category: 'Basic',
    supportsTVOS: true,
  },
  {
    key: 'JSResponderHandlerExample',
    module: require('../examples/JSResponderHandlerExample/JSResponderHandlerExample'),
  },
  {
    key: 'InputAccessoryViewExample',
    module: require('../examples/InputAccessoryView/InputAccessoryViewExample'),
    supportsTVOS: true,
  },
  {
    key: 'KeyboardAvoidingViewExample',
    module: require('../examples/KeyboardAvoidingView/KeyboardAvoidingViewExample'),
    supportsTVOS: false,
  },
  {
    key: 'LayoutEventsExample',
    module: require('../examples/Layout/LayoutEventsExample'),
    supportsTVOS: true,
  },
  {
    key: 'ModalExample',
    module: require('../examples/Modal/ModalExample'),
    supportsTVOS: true,
  },
  {
    key: 'NewAppScreenExample',
    module: require('../examples/NewAppScreen/NewAppScreenExample'),
    supportsTVOS: false,
  },
  {
    key: 'PressableExample',
    module: require('../examples/Pressable/PressableExample'),
    supportsTVOS: true,
  },
  {
    key: 'RefreshControlExample',
    module: require('../examples/RefreshControl/RefreshControlExample'),
    supportsTVOS: false,
  },
  {
    key: 'ScrollViewSimpleExample',
    module: require('../examples/ScrollView/ScrollViewSimpleExample'),
    category: 'Basic',
    supportsTVOS: true,
  },
  {
    key: 'SafeAreaViewExample',
    module: require('../examples/SafeAreaView/SafeAreaViewExample'),
    supportsTVOS: true,
  },
  {
    key: 'ScrollViewExample',
    module: require('../examples/ScrollView/ScrollViewExample'),
    category: 'Basic',
    supportsTVOS: true,
  },
  {
    key: 'ScrollViewAnimatedExample',
    module: require('../examples/ScrollView/ScrollViewAnimatedExample'),
    supportsTVOS: true,
  },
  {
    key: 'ScrollViewIndicatorInsetsExample',
    module: require('../examples/ScrollView/ScrollViewIndicatorInsetsExample'),
  },
  {
    key: 'SectionListIndex',
    module: require('../examples/SectionList/SectionListIndex'),
    category: 'ListView',
    supportsTVOS: true,
  },
  {
    key: 'StatusBarExample',
    module: require('../examples/StatusBar/StatusBarExample'),
    supportsTVOS: false,
  },
  {
    key: 'SwipeableCardExample',
    module: require('../examples/SwipeableCardExample/SwipeableCardExample'),
    category: 'UI',
    supportsTVOS: false,
  },
  {
    key: 'SwitchExample',
    module: require('../examples/Switch/SwitchExample'),
    category: 'UI',
    supportsTVOS: false,
  },
  {
    key: 'TextExample',
    module: require('../examples/Text/TextExample.ios'),
    category: 'Basic',
    supportsTVOS: true,
  },
  {
    key: 'TextInputExample',
    module: require('../examples/TextInput/TextInputExample'),
    category: 'Basic',
    supportsTVOS: true,
  },
  {
    key: 'TouchableExample',
    module: require('../examples/Touchable/TouchableExample'),
    supportsTVOS: true,
  },
  {
    key: 'TransparentHitTestExample',
    module: require('../examples/TransparentHitTest/TransparentHitTestExample'),
    supportsTVOS: false,
  },
  {
    key: 'ViewExample',
    module: require('../examples/View/ViewExample'),
    category: 'Basic',
    supportsTVOS: true,
  },
  {
    key: 'NewArchitectureExample',
    category: 'UI',
    module: require('../examples/NewArchitecture/NewArchitectureExample'),
    supportsTVOS: false,
  },
];

const APIs: Array<RNTesterModuleInfo> = [
  {
    key: 'AccessibilityExample',
    module: require('../examples/Accessibility/AccessibilityExample'),
    supportsTVOS: false,
  },
  {
    key: 'AccessibilityIOSExample',
    module: require('../examples/Accessibility/AccessibilityIOSExample'),
    category: 'iOS',
    supportsTVOS: false,
  },
  {
    key: 'ActionSheetIOSExample',
    module: require('../examples/ActionSheetIOS/ActionSheetIOSExample'),
    category: 'iOS',
    supportsTVOS: true,
  },
  {
    key: 'AlertIOSExample',
    module: require('../examples/Alert/AlertIOSExample'),
    category: 'iOS',
    supportsTVOS: true,
  },
  {
    key: 'AnimatedIndex',
    module: require('../examples/Animated/AnimatedIndex').default,
    supportsTVOS: true,
  },
  {
    key: 'AnExApp',
    module: require('../examples/AnimatedGratuitousApp/AnExApp'),
    supportsTVOS: true,
  },
  {
    key: 'AppearanceExample',
    module: require('../examples/Appearance/AppearanceExample'),
    supportsTVOS: false,
  },
  {
    key: 'AppStateExample',
    module: require('../examples/AppState/AppStateExample'),
    supportsTVOS: true,
  },
  {
    key: 'BorderExample',
    module: require('../examples/Border/BorderExample'),
    supportsTVOS: true,
  },
  {
    key: 'BoxShadowExample',
    module: require('../examples/BoxShadow/BoxShadowExample'),
    supportsTVOS: true,
  },
  {
    key: 'CrashExample',
    module: require('../examples/Crash/CrashExample'),
    supportsTVOS: false,
  },
  {
    key: 'DevSettings',
    module: require('../examples/DevSettings/DevSettingsExample'),
  },
  {
    key: 'Dimensions',
    module: require('../examples/Dimensions/DimensionsExample'),
    supportsTVOS: true,
  },
  {
    key: 'Keyboard',
    module: require('../examples/Keyboard/KeyboardExample').default,
    supportsTVOS: true,
  },
  {
    key: 'LayoutAnimationExample',
    module: require('../examples/Layout/LayoutAnimationExample'),
    supportsTVOS: true,
  },
  {
    key: 'LayoutExample',
    module: require('../examples/Layout/LayoutExample'),
    supportsTVOS: true,
  },
  {
    key: 'LinkingExample',
    module: require('../examples/Linking/LinkingExample'),
    supportsTVOS: true,
  },
  {
    key: 'NativeAnimationsExample',
    module: require('../examples/NativeAnimation/NativeAnimationsExample'),
    supportsTVOS: true,
  },
  {
    key: 'OrientationChangeExample',
    module: require('../examples/OrientationChange/OrientationChangeExample'),
    supportsTVOS: false,
  },
  {
    key: 'PanResponderExample',
    module: require('../examples/PanResponder/PanResponderExample'),
    supportsTVOS: false,
  },
  {
    key: 'PlatformColorExample',
    module: require('../examples/PlatformColor/PlatformColorExample'),
    supportsTVOS: true,
  },
  {
    key: 'PointerEventsExample',
    module: require('../examples/PointerEvents/PointerEventsExample'),
    supportsTVOS: false,
  },
  {
    key: 'RCTRootViewIOSExample',
    module: require('../examples/RCTRootView/RCTRootViewIOSExample'),
    supportsTVOS: true,
  },
  {
    key: 'RTLExample',
    module: require('../examples/RTL/RTLExample'),
    supportsTVOS: true,
  },
  {
    key: 'ShareExample',
    module: require('../examples/Share/ShareExample'),
    supportsTVOS: true,
  },
  {
    key: 'SnapshotExample',
    module: require('../examples/Snapshot/SnapshotExample'),
    supportsTVOS: true,
  },
  {
    key: 'TimerExample',
    module: require('../examples/Timer/TimerExample'),
    supportsTVOS: true,
  },
  {
    key: 'TransformExample',
    module: require('../examples/Transform/TransformExample'),
    supportsTVOS: true,
  },
  {
    key: 'TurboModuleExample',
    module: require('../examples/TurboModule/TurboModuleExample'),
    supportsTVOS: false,
  },
  {
    key: 'TurboCxxModuleExample',
    module: require('../examples/TurboModule/TurboCxxModuleExample'),
  },
  {
    key: 'VibrationExample',
    module: require('../examples/Vibration/VibrationExample'),
    supportsTVOS: false,
  },
  {
    key: 'WebSocketExample',
    module: require('../examples/WebSocket/WebSocketExample'),
    supportsTVOS: true,
  },
  {
    key: 'XHRExample',
    module: require('../examples/XHR/XHRExample'),
    supportsTVOS: true,
  },
];

if (ReactNativeFeatureFlags.shouldEmitW3CPointerEvents()) {
  APIs.push({
    key: 'W3C PointerEvents',
    category: 'Experimental',
    module: require('../examples/Experimental/W3CPointerEventsExample').default,
  });
}

const Modules: {...} = {};

APIs.concat(Components).forEach(Example => {
  Modules[Example.key] = Example.module;
});

const RNTesterList = {
  APIs,
  Components,
  Modules,
};

module.exports = RNTesterList;
