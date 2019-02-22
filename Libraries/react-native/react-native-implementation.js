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

// Components
export {default as AccessibilityInfo} from 'AccessibilityInfo';
export {default as ActivityIndicator} from 'ActivityIndicator';
export {default as ART} from 'ReactNativeART';
export {default as Button} from 'Button';
export {default as CheckBox} from 'CheckBox';
export {default as DatePickerIOS} from 'DatePickerIOS';
export {default as DrawerLayoutAndroid} from 'DrawerLayoutAndroid';
export {default as FlatList} from 'FlatList';
export {default as Image} from 'Image';
export {default as ImageBackground} from 'ImageBackground';
export {default as ImageEditor} from 'ImageEditor';
export {default as ImageStore} from 'ImageStore';
export {default as InputAccessoryView} from 'InputAccessoryView';
export {default as KeyboardAvoidingView} from 'KeyboardAvoidingView';
export {default as MaskedViewIOS} from 'MaskedViewIOS';
export {default as Modal} from 'Modal';
export {default as Picker} from 'Picker';
export {default as PickerIOS} from 'PickerIOS';
export {default as ProgressBarAndroid} from 'ProgressBarAndroid';
export {default as ProgressViewIOS} from 'ProgressViewIOS';
export {default as SafeAreaView} from 'SafeAreaView';
export {default as ScrollView} from 'ScrollView';
export {default as SectionList} from 'SectionList';
export {default as SegmentedControlIOS} from 'SegmentedControlIOS';
export {default as Slider} from 'Slider';
export {default as Switch} from 'Switch';
export {default as RefreshControl} from 'RefreshControl';
export {default as StatusBar} from 'StatusBar';
export {default as SwipeableFlatList} from 'SwipeableFlatList';
export {default as Text} from 'Text';
export {default as TextInput} from 'TextInput';
export {default as ToolbarAndroid} from 'ToolbarAndroid';
export {default as Touchable} from 'Touchable';
export {default as TouchableHighlight} from 'TouchableHighlight';
export {default as TouchableNativeFeedback} from 'TouchableNativeFeedback';
export {default as TouchableOpacity} from 'TouchableOpacity';
export {default as TouchableWithoutFeedback} from 'TouchableWithoutFeedback';
export {default as View} from 'View';
export {default as ViewPagerAndroid} from 'ViewPagerAndroid';
export {default as VirtualizedList} from 'VirtualizedList';
export {default as WebView} from 'WebView';

// APIs
export {default as ActionSheetIOS} from 'ActionSheetIOS';
export {default as Alert} from 'Alert';
export {default as Animated} from 'Animated';
export {default as AppRegistry} from 'AppRegistry';
export {default as AppState} from 'AppState';
export {default as AsyncStorage} from 'AsyncStorage';
export {default as BackHandler} from 'BackHandler';
export {default as CameraRoll} from 'CameraRoll';
export {default as Clipboard} from 'Clipboard';
export {default as DatePickerAndroid} from 'DatePickerAndroid';
export {default as DeviceInfo} from 'DeviceInfo';
export {default as Dimensions} from 'Dimensions';
export {default as Easing} from 'Easing';
export {findNodeHandle} from 'ReactNative';
export {default as I18nManager} from 'I18nManager';
export {default as ImagePickerIOS} from 'ImagePickerIOS';
export {default as InteractionManager} from 'InteractionManager';
export {default as Keyboard} from 'Keyboard';
export {default as LayoutAnimation} from 'LayoutAnimation';
export {default as Linking} from 'Linking';
export {default as NativeEventEmitter} from 'NativeEventEmitter';
export {default as NetInfo} from 'NetInfo';
export {default as PanResponder} from 'PanResponder';
export {default as PermissionsAndroid} from 'PermissionsAndroid';
export {default as PixelRatio} from 'PixelRatio';
export {default as PushNotificationIOS} from 'PushNotificationIOS';
export {default as Settings} from 'Settings';
export {default as Share} from 'Share';
export {default as StatusBarIOS} from 'StatusBarIOS';
export {default as StyleSheet} from 'StyleSheet';
export {default as Systrace} from 'Systrace';
export {default as TimePickerAndroid} from 'TimePickerAndroid';
export {default as ToastAndroid} from 'ToastAndroid';
export {default as TVEventHandler} from 'TVEventHandler';
export {default as UIManager} from 'UIManager';
export {unstable_batchedUpdates} from 'ReactNative';
export {default as UTFSequence} from 'UTFSequence';
export {default as Vibration} from 'Vibration';
export {default as YellowBox} from 'YellowBox';

// Plugins
export {default as DeviceEventEmitter} from 'RCTDeviceEventEmitter';
export {default as NativeAppEventEmitter} from 'RCTNativeAppEventEmitter';
export {default as NativeModules} from 'NativeModules';
export {default as Platform} from 'Platform';
export {default as processColor} from 'processColor';
export {default as requireNativeComponent} from 'requireNativeComponent';

// Prop Types
export {default as ColorPropType} from 'DeprecatedColorPropType';
export {default as EdgeInsetsPropType} from 'DeprecatedEdgeInsetsPropType';
export {default as PointPropType} from 'DeprecatedPointPropType';
export {default as ViewPropTypes} from 'DeprecatedViewPropTypes';

// NOTE(2019-03-19): Legacy alias that is deprecated and not yet removed
// $FlowFixMe: Flow always wants a "value" property: https://github.com/facebook/flow/issues/5380
Object.defineProperty(exports, 'AlertIOS', {
  enumerable: true,
  get() {
    const warnOnce = require('warnOnce');
    warnOnce(
      'alert-ios',
      'AlertIOS is deprecated. Use the `Alert` module directly instead.',
    );
    return require('Alert');
  },
});

if (__DEV__) {
  const invariant = require('invariant');

  // $FlowFixMe This is intentional: Flow will error when attempting to access ListView.
  Object.defineProperty(module.exports, 'ListView', {
    configurable: true,
    get() {
      invariant(
        false,
        'ListView has been removed from React Native. ' +
          'See https://fb.me/nolistview for more information or use ' +
          '`deprecated-react-native-listview`.',
      );
    },
  });

  // $FlowFixMe This is intentional: Flow will error when attempting to access SwipeableListView.
  Object.defineProperty(module.exports, 'SwipeableListView', {
    configurable: true,
    get() {
      invariant(
        false,
        'SwipeableListView has been removed from React Native. ' +
          'See https://fb.me/nolistview for more information or use ' +
          '`deprecated-react-native-swipeable-listview`.',
      );
    },
  });
}
