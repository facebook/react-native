/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule react-native-implementation
 * @flow
 */
'use strict';

const invariant = require('fbjs/lib/invariant');

// Export React, plus some native additions.
const ReactNative = {
  // Components
  get AccessibilityInfo() { return require('../Components/AccessibilityInfo/AccessibilityInfo'); },
  get ActivityIndicator() { return require('../Components/ActivityIndicator/ActivityIndicator'); },
  get ART() { return require('../ART/ReactNativeART'); },
  get Button() { return require('../Components/Button'); },
  get DatePickerIOS() { return require('../Components/DatePicker/DatePickerIOS'); },
  get DrawerLayoutAndroid() { return require('../Components/DrawerAndroid/DrawerLayoutAndroid'); },
  get FlatList() { return require('../Lists/FlatList'); },
  get Image() { return require('../Image/Image'); },
  get ImageBackground() { return require('../Image/ImageBackground'); },
  get ImageEditor() { return require('../Image/ImageEditor'); },
  get ImageStore() { return require('../Image/ImageStore'); },
  get KeyboardAvoidingView() { return require('../Components/Keyboard/KeyboardAvoidingView'); },
  get ListView() { return require('../Lists/ListView/ListView'); },
  get Modal() { return require('../Modal/Modal'); },
  get NavigatorIOS() { return require('../Components/Navigation/NavigatorIOS'); },
  get Picker() { return require('../Components/Picker/Picker'); },
  get PickerIOS() { return require('../Components/Picker/PickerIOS'); },
  get ProgressBarAndroid() { return require('../Components/ProgressBarAndroid/ProgressBarAndroid'); },
  get ProgressViewIOS() { return require('../Components/ProgressViewIOS/ProgressViewIOS'); },
  get ScrollView() { return require('../Components/ScrollView/ScrollView'); },
  get SectionList() { return require('../Lists/SectionList'); },
  get SegmentedControlIOS() { return require('../Components/SegmentedControlIOS/SegmentedControlIOS'); },
  get Slider() { return require('../Components/Slider/Slider'); },
  get SnapshotViewIOS() { return require('../RCTTest/SnapshotViewIOS'); },
  get Switch() { return require('../Components/Switch/Switch'); },
  get RefreshControl() { return require('../Components/RefreshControl/RefreshControl'); },
  get StatusBar() { return require('../Components/StatusBar/StatusBar'); },
  get SwipeableListView() { return require('../Experimental/SwipeableRow/SwipeableListView'); },
  get TabBarIOS() { return require('../Components/TabBarIOS/TabBarIOS'); },
  get Text() { return require('../Text/Text'); },
  get TextInput() { return require('../Components/TextInput/TextInput'); },
  get ToastAndroid() { return require('../Components/ToastAndroid/ToastAndroid'); },
  get ToolbarAndroid() { return require('../Components/ToolbarAndroid/ToolbarAndroid'); },
  get Touchable() { return require('../Components/Touchable/Touchable'); },
  get TouchableHighlight() { return require('../Components/Touchable/TouchableHighlight'); },
  get TouchableNativeFeedback() { return require('../Components/Touchable/TouchableNativeFeedback'); },
  get TouchableOpacity() { return require('../Components/Touchable/TouchableOpacity'); },
  get TouchableWithoutFeedback() { return require('../Components/Touchable/TouchableWithoutFeedback'); },
  get View() { return require('../Components/View/View'); },
  get ViewPagerAndroid() { return require('../Components/ViewPager/ViewPagerAndroid'); },
  get VirtualizedList() { return require('../Lists/VirtualizedList'); },
  get WebView() { return require('../Components/WebView/WebView'); },

  // APIs
  get ActionSheetIOS() { return require('../ActionSheetIOS/ActionSheetIOS'); },
  get AdSupportIOS() { return require('../AdSupport/AdSupportIOS'); },
  get Alert() { return require('../Alert/Alert'); },
  get AlertIOS() { return require('../Alert/AlertIOS'); },
  get Animated() { return require('../Animated/src/Animated'); },
  get AppRegistry() { return require('../ReactNative/AppRegistry'); },
  get AppState() { return require('../AppState/AppState'); },
  get AsyncStorage() { return require('../Storage/AsyncStorage'); },
  get BackAndroid() { return require('../Utilities/BackAndroid'); }, // deprecated: use BackHandler instead
  get BackHandler() { return require('../Utilities/BackHandler'); },
  get CameraRoll() { return require('../CameraRoll/CameraRoll'); },
  get Clipboard() { return require('../Components/Clipboard/Clipboard'); },
  get DatePickerAndroid() { return require('../Components/DatePickerAndroid/DatePickerAndroid'); },
  get DeviceInfo() { return require('../Utilities/DeviceInfo'); },
  get Dimensions() { return require('../Utilities/Dimensions'); },
  get Easing() { return require('../Animated/src/Easing'); },
  get findNodeHandle() { return require('../Renderer/src/renderers/native/ReactNative').findNodeHandle; },
  get I18nManager() { return require('../ReactNative/I18nManager'); },
  get ImagePickerIOS() { return require('../CameraRoll/ImagePickerIOS'); },
  get InteractionManager() { return require('../Interaction/InteractionManager'); },
  get Keyboard() { return require('../Components/Keyboard/Keyboard'); },
  get LayoutAnimation() { return require('../LayoutAnimation/LayoutAnimation'); },
  get Linking() { return require('../Linking/Linking'); },
  get NativeEventEmitter() { return require('../EventEmitter/NativeEventEmitter'); },
  get NetInfo() { return require('../Network/NetInfo'); },
  get PanResponder() { return require('../Interaction/PanResponder'); },
  get PermissionsAndroid() { return require('../PermissionsAndroid/PermissionsAndroid'); },
  get PixelRatio() { return require('../Utilities/PixelRatio'); },
  get PushNotificationIOS() { return require('../PushNotificationIOS/PushNotificationIOS'); },
  get Settings() { return require('../Settings/Settings'); },
  get Share() { return require('../Share/Share'); },
  get StatusBarIOS() { return require('../Components/StatusBar/StatusBarIOS'); },
  get StyleSheet() { return require('../StyleSheet/StyleSheet'); },
  get Systrace() { return require('../Performance/Systrace'); },
  get TimePickerAndroid() { return require('../Components/TimePickerAndroid/TimePickerAndroid'); },
  get TVEventHandler() { return require('../Components/AppleTV/TVEventHandler'); },
  get UIManager() { return require('../ReactNative/UIManager'); },
  get Vibration() { return require('../Vibration/Vibration'); },
  get VibrationIOS() { return require('../Vibration/VibrationIOS'); },

  // Plugins
  get DeviceEventEmitter() { return require('../EventEmitter/RCTDeviceEventEmitter'); },
  get NativeAppEventEmitter() { return require('../EventEmitter/RCTNativeAppEventEmitter'); },
  get NativeModules() { return require('../BatchedBridge/NativeModules'); },
  get Platform() { return require('../Utilities/Platform'); },
  get processColor() { return require('../StyleSheet/processColor'); },
  get requireNativeComponent() { return require('../ReactNative/requireNativeComponent'); },
  get takeSnapshot() { return require('../Renderer/src/renderers/native/takeSnapshot'); },

  // Prop Types
  get ColorPropType() { return require('../StyleSheet/ColorPropType'); },
  get EdgeInsetsPropType() { return require('../StyleSheet/EdgeInsetsPropType'); },
  get PointPropType() { return require('../StyleSheet/PointPropType'); },
  get ViewPropTypes() { return require('../Components/View/ViewPropTypes'); },

  // Deprecated
  get Navigator() {
    invariant(
      false,
      'Navigator is deprecated and has been removed from this package. It can now be installed ' +
      'and imported from `react-native-deprecated-custom-components` instead of `react-native`. ' +
      'Learn about alternative navigation solutions at http://facebook.github.io/react-native/docs/navigation.html'
    );
  },
};

module.exports = ReactNative;
