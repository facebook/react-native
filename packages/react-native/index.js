/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

'use strict';
'use client';

// ----------------------------------------------------------------------------
// Runtime entry point for react-native.
//
// This module is separate from index.js.flow as it provides a more lenient
// `module.exports` API at runtime, for lazy module loading and backwards
// compatibility.
//
// IMPORTANT: Keep this file in sync with index.js.flow. Test your changes
// whenever updating React Native's public API.
// ----------------------------------------------------------------------------

import typeof * as ReactNativePublicAPI from './index.js.flow';

const warnOnce = require('./Libraries/Utilities/warnOnce').default;
const invariant = require('invariant');

module.exports = {
  // #region Components
  get ActivityIndicator() {
    return require('./Libraries/Components/ActivityIndicator/ActivityIndicator')
      .default;
  },
  get Button() {
    return require('./Libraries/Components/Button').default;
  },
  get DrawerLayoutAndroid() {
    return require('./Libraries/Components/DrawerAndroid/DrawerLayoutAndroid')
      .default;
  },
  get FlatList() {
    return require('./Libraries/Lists/FlatList').default;
  },
  get Image() {
    return require('./Libraries/Image/Image').default;
  },
  get ImageBackground() {
    return require('./Libraries/Image/ImageBackground').default;
  },
  get InputAccessoryView() {
    return require('./Libraries/Components/TextInput/InputAccessoryView')
      .default;
  },
  get KeyboardAvoidingView() {
    return require('./Libraries/Components/Keyboard/KeyboardAvoidingView')
      .default;
  },
  get experimental_LayoutConformance() {
    return require('./Libraries/Components/LayoutConformance/LayoutConformance')
      .default;
  },
  get Modal() {
    return require('./Libraries/Modal/Modal').default;
  },
  get Pressable() {
    return require('./Libraries/Components/Pressable/Pressable').default;
  },
  get ProgressBarAndroid() {
    warnOnce(
      'progress-bar-android-moved',
      'ProgressBarAndroid has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/progress-bar-android' instead of 'react-native'. " +
        'See https://github.com/react-native-progress-view/progress-bar-android',
    );
    return require('./Libraries/Components/ProgressBarAndroid/ProgressBarAndroid')
      .default;
  },
  get RefreshControl() {
    return require('./Libraries/Components/RefreshControl/RefreshControl')
      .default;
  },
  /**
   * @deprecated SafeAreaView has been deprecated and will be removed in a future release.
   * Please use 'react-native-safe-area-context' instead.
   * See https://github.com/AppAndFlow/react-native-safe-area-context
   */
  get SafeAreaView() {
    warnOnce(
      'safe-area-view-deprecated',
      'SafeAreaView has been deprecated and will be removed in a future release. ' +
        "Please use 'react-native-safe-area-context' instead. " +
        'See https://github.com/AppAndFlow/react-native-safe-area-context',
    );
    return require('./Libraries/Components/SafeAreaView/SafeAreaView').default;
  },
  get ScrollView() {
    return require('./Libraries/Components/ScrollView/ScrollView').default;
  },
  get SectionList() {
    return require('./Libraries/Lists/SectionList').default;
  },
  get StatusBar() {
    return require('./Libraries/Components/StatusBar/StatusBar').default;
  },
  get Switch() {
    return require('./Libraries/Components/Switch/Switch').default;
  },
  get Text() {
    return require('./Libraries/Text/Text').default;
  },
  get unstable_TextAncestorContext() {
    return require('./Libraries/Text/TextAncestorContext').default;
  },
  get TextInput() {
    return require('./Libraries/Components/TextInput/TextInput').default;
  },
  get Touchable() {
    return require('./Libraries/Components/Touchable/Touchable').default;
  },
  get TouchableHighlight() {
    return require('./Libraries/Components/Touchable/TouchableHighlight')
      .default;
  },
  get TouchableNativeFeedback() {
    return require('./Libraries/Components/Touchable/TouchableNativeFeedback')
      .default;
  },
  get TouchableOpacity() {
    return require('./Libraries/Components/Touchable/TouchableOpacity').default;
  },
  get TouchableWithoutFeedback() {
    return require('./Libraries/Components/Touchable/TouchableWithoutFeedback')
      .default;
  },
  get View() {
    return require('./Libraries/Components/View/View').default;
  },
  get VirtualizedList() {
    return require('./Libraries/Lists/VirtualizedList').default;
  },
  get VirtualizedSectionList() {
    return require('./Libraries/Lists/VirtualizedSectionList').default;
  },
  get unstable_VirtualView() {
    return require('./src/private/components/virtualview/VirtualView').default;
  },
  // #endregion
  // #region APIs
  get AccessibilityInfo() {
    return require('./Libraries/Components/AccessibilityInfo/AccessibilityInfo')
      .default;
  },
  get ActionSheetIOS() {
    return require('./Libraries/ActionSheetIOS/ActionSheetIOS').default;
  },
  get Alert() {
    return require('./Libraries/Alert/Alert').default;
  },
  // Include any types exported in the Animated module together with its default export, so
  // you can references types such as Animated.Numeric
  get Animated() {
    return require('./Libraries/Animated/Animated').default;
  },
  get Appearance() {
    return require('./Libraries/Utilities/Appearance');
  },
  get AppRegistry() {
    return require('./Libraries/ReactNative/AppRegistry').AppRegistry;
  },
  get AppState() {
    return require('./Libraries/AppState/AppState').default;
  },
  get BackHandler() {
    return require('./Libraries/Utilities/BackHandler').default;
  },
  get Clipboard() {
    warnOnce(
      'clipboard-moved',
      'Clipboard has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-clipboard/clipboard' instead of 'react-native'. " +
        'See https://github.com/react-native-clipboard/clipboard',
    );
    return require('./Libraries/Components/Clipboard/Clipboard').default;
  },
  get codegenNativeCommands() {
    return require('./Libraries/Utilities/codegenNativeCommands').default;
  },
  get codegenNativeComponent() {
    return require('./Libraries/Utilities/codegenNativeComponent').default;
  },
  get DeviceEventEmitter() {
    return require('./Libraries/EventEmitter/RCTDeviceEventEmitter').default;
  },
  get DeviceInfo() {
    return require('./Libraries/Utilities/DeviceInfo').default;
  },
  get DevMenu() {
    return require('./src/private/devsupport/devmenu/DevMenu').default;
  },
  get DevSettings() {
    return require('./Libraries/Utilities/DevSettings').default;
  },
  get Dimensions() {
    return require('./Libraries/Utilities/Dimensions').default;
  },
  get DynamicColorIOS() {
    return require('./Libraries/StyleSheet/PlatformColorValueTypesIOS')
      .DynamicColorIOS;
  },
  get Easing() {
    return require('./Libraries/Animated/Easing').default;
  },
  get findNodeHandle() {
    return require('./Libraries/ReactNative/RendererProxy').findNodeHandle;
  },
  get I18nManager() {
    return require('./Libraries/ReactNative/I18nManager').default;
  },
  /**
   * @deprecated
   */
  get InteractionManager() {
    warnOnce(
      'interaction-manager-deprecated',
      'InteractionManager has been deprecated and will be removed in a ' +
        'future release. Please refactor long tasks into smaller ones, and ' +
        " use 'requestIdleCallback' instead.",
    );
    return require('./Libraries/Interaction/InteractionManager').default;
  },
  get Keyboard() {
    return require('./Libraries/Components/Keyboard/Keyboard').default;
  },
  get LayoutAnimation() {
    return require('./Libraries/LayoutAnimation/LayoutAnimation').default;
  },
  get Linking() {
    return require('./Libraries/Linking/Linking').default;
  },
  get LogBox() {
    return require('./Libraries/LogBox/LogBox').default;
  },
  get NativeAppEventEmitter() {
    return require('./Libraries/EventEmitter/RCTNativeAppEventEmitter').default;
  },
  get NativeComponentRegistry() {
    return require('./Libraries/NativeComponent/NativeComponentRegistry');
  },
  get NativeDialogManagerAndroid() {
    return require('./Libraries/NativeModules/specs/NativeDialogManagerAndroid')
      .default;
  },
  get NativeEventEmitter() {
    return require('./Libraries/EventEmitter/NativeEventEmitter').default;
  },
  get NativeModules() {
    return require('./Libraries/BatchedBridge/NativeModules').default;
  },
  get Networking() {
    return require('./Libraries/Network/RCTNetworking').default;
  },
  get PanResponder() {
    return require('./Libraries/Interaction/PanResponder').default;
  },
  get PermissionsAndroid() {
    return require('./Libraries/PermissionsAndroid/PermissionsAndroid').default;
  },
  get PixelRatio() {
    return require('./Libraries/Utilities/PixelRatio').default;
  },
  get Platform() {
    return require('./Libraries/Utilities/Platform').default;
  },
  get PlatformColor() {
    return require('./Libraries/StyleSheet/PlatformColorValueTypes')
      .PlatformColor;
  },
  get PushNotificationIOS() {
    warnOnce(
      'pushNotificationIOS-moved',
      'PushNotificationIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/push-notification-ios' instead of 'react-native'. " +
        'See https://github.com/react-native-push-notification/ios',
    );
    return require('./Libraries/PushNotificationIOS/PushNotificationIOS')
      .default;
  },
  get processColor() {
    return require('./Libraries/StyleSheet/processColor').default;
  },
  get registerCallableModule() {
    return require('./Libraries/Core/registerCallableModule').default;
  },
  get requireNativeComponent() {
    return require('./Libraries/ReactNative/requireNativeComponent').default;
  },
  get ReactNativeVersion() {
    return require('./Libraries/Core/ReactNativeVersion').default;
  },
  get RootTagContext() {
    return require('./Libraries/ReactNative/RootTag').RootTagContext;
  },
  get Settings() {
    return require('./Libraries/Settings/Settings').default;
  },
  get Share() {
    return require('./Libraries/Share/Share').default;
  },
  get StyleSheet() {
    return require('./Libraries/StyleSheet/StyleSheet').default;
  },
  get Systrace() {
    return require('./Libraries/Performance/Systrace');
  },
  get ToastAndroid() {
    return require('./Libraries/Components/ToastAndroid/ToastAndroid').default;
  },
  get TurboModuleRegistry() {
    return require('./Libraries/TurboModule/TurboModuleRegistry');
  },
  get UIManager() {
    return require('./Libraries/ReactNative/UIManager').default;
  },
  get unstable_batchedUpdates() {
    return require('./Libraries/ReactNative/RendererProxy')
      .unstable_batchedUpdates;
  },
  get useAnimatedValue() {
    return require('./Libraries/Animated/useAnimatedValue').default;
  },
  get useColorScheme() {
    return require('./Libraries/Utilities/useColorScheme').default;
  },
  get useWindowDimensions() {
    return require('./Libraries/Utilities/useWindowDimensions').default;
  },
  get UTFSequence() {
    return require('./Libraries/UTFSequence').default;
  },
  get Vibration() {
    return require('./Libraries/Vibration/Vibration').default;
  },
  get VirtualViewMode() {
    return require('./src/private/components/virtualview/VirtualView')
      .VirtualViewMode;
  },
  // #endregion
} as ReactNativePublicAPI;

if (__DEV__) {
  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access AsyncStorage. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access AsyncStorage. */
  Object.defineProperty(module.exports, 'AsyncStorage', {
    configurable: true,
    get() {
      invariant(
        false,
        'AsyncStorage has been removed from react-native core. ' +
          "It can now be installed and imported from '@react-native-async-storage/async-storage' instead of 'react-native'. " +
          'See https://github.com/react-native-async-storage/async-storage',
      );
    },
  });
  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access ImagePickerIOS. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access ImagePickerIOS. */
  Object.defineProperty(module.exports, 'ImagePickerIOS', {
    configurable: true,
    get() {
      invariant(
        false,
        'ImagePickerIOS has been removed from React Native. ' +
          "Please upgrade to use either 'react-native-image-picker' or 'expo-image-picker'. " +
          "If you cannot upgrade to a different library, please install the deprecated '@react-native-community/image-picker-ios' package. " +
          'See https://github.com/rnc-archive/react-native-image-picker-ios',
      );
    },
  });
  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access ProgressViewIOS. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access ProgressViewIOS. */
  Object.defineProperty(module.exports, 'ProgressViewIOS', {
    configurable: true,
    get() {
      invariant(
        false,
        'ProgressViewIOS has been removed from react-native core. ' +
          "It can now be installed and imported from '@react-native-community/progress-view' instead of 'react-native'. " +
          'See https://github.com/react-native-progress-view/progress-view',
      );
    },
  });
  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access DatePickerIOS. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access DatePickerIOS. */
  Object.defineProperty(module.exports, 'DatePickerIOS', {
    configurable: true,
    get() {
      invariant(
        false,
        'DatePickerIOS has been removed from react-native core. ' +
          "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " +
          'See https://github.com/react-native-datetimepicker/datetimepicker',
      );
    },
  });
  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access Slider. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access Slider. */
  Object.defineProperty(module.exports, 'Slider', {
    configurable: true,
    get() {
      invariant(
        false,
        'Slider has been removed from react-native core. ' +
          "It can now be installed and imported from '@react-native-community/slider' instead of 'react-native'. " +
          'See https://github.com/callstack/react-native-slider',
      );
    },
  });
}
