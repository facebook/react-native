/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const components = [
  '../Libraries/Components/ActivityIndicator/ActivityIndicator.js',
  '../Libraries/Components/Button.js',
  '../Libraries/Components/DatePicker/DatePickerIOS.ios.js',
  '../Libraries/Components/DrawerAndroid/DrawerLayoutAndroid.android.js',
  '../Libraries/Image/Image.ios.js',
  '../Libraries/Components/Keyboard/KeyboardAvoidingView.js',
  '../Libraries/CustomComponents/ListView/ListView.js',
  '../Libraries/Components/MapView/MapView.js',
  '../Libraries/Modal/Modal.js',
  '../Libraries/CustomComponents/Navigator/Navigator.js',
  '../Libraries/Components/Navigation/NavigatorIOS.ios.js',
  '../Libraries/Components/Picker/Picker.js',
  '../Libraries/Components/Picker/PickerIOS.ios.js',
  '../Libraries/Components/ProgressBarAndroid/ProgressBarAndroid.android.js',
  '../Libraries/Components/ProgressViewIOS/ProgressViewIOS.ios.js',
  '../Libraries/Components/RefreshControl/RefreshControl.js',
  '../Libraries/Components/ScrollView/ScrollView.js',
  '../Libraries/Components/SegmentedControlIOS/SegmentedControlIOS.ios.js',
  '../Libraries/Components/Slider/Slider.js',
  '../Libraries/RCTTest/SnapshotViewIOS.ios.js',
  '../Libraries/Components/StatusBar/StatusBar.js',
  '../Libraries/Components/Switch/Switch.js',
  '../Libraries/Components/TabBarIOS/TabBarIOS.ios.js',
  '../Libraries/Components/TabBarIOS/TabBarItemIOS.ios.js',
  '../Libraries/Text/Text.js',
  '../Libraries/Components/TextInput/TextInput.js',
  '../Libraries/Components/ToolbarAndroid/ToolbarAndroid.android.js',
  '../Libraries/Components/Touchable/TouchableHighlight.js',
  '../Libraries/Components/Touchable/TouchableNativeFeedback.android.js',
  '../Libraries/Components/Touchable/TouchableOpacity.js',
  '../Libraries/Components/Touchable/TouchableWithoutFeedback.js',
  '../Libraries/Components/View/View.js',
  '../Libraries/Components/ViewPager/ViewPagerAndroid.android.js',
  '../Libraries/Components/WebView/WebView.ios.js',
];

const apis = [
  '../Libraries/ActionSheetIOS/ActionSheetIOS.js',
  '../Libraries/AdSupport/AdSupportIOS.js',
  '../Libraries/Alert/Alert.js',
  '../Libraries/Alert/AlertIOS.js',
  '../Libraries/Animated/src/AnimatedImplementation.js',
  '../Libraries/ReactNative/AppRegistry.js',
  '../Libraries/AppState/AppState.js',
  '../Libraries/Storage/AsyncStorage.js',
  '../Libraries/Utilities/BackAndroid.android.js',
  '../Libraries/CameraRoll/CameraRoll.js',
  '../Libraries/Components/Clipboard/Clipboard.js',
  '../Libraries/Components/DatePickerAndroid/DatePickerAndroid.android.js',
  '../Libraries/Utilities/Dimensions.js',
  '../Libraries/Animated/src/Easing.js',
  '../Libraries/Geolocation/Geolocation.js',
  '../Libraries/Image/ImageEditor.js',
  '../Libraries/CameraRoll/ImagePickerIOS.js',
  '../Libraries/Image/ImageStore.js',
  '../Libraries/Interaction/InteractionManager.js',
  '../Libraries/Components/Keyboard/Keyboard.js',
  '../Libraries/LayoutAnimation/LayoutAnimation.js',
  '../Libraries/Linking/Linking.js',
  '../Libraries/CustomComponents/ListView/ListViewDataSource.js',
  '../Libraries/Renderer/src/renderers/native/NativeMethodsMixin.js',
  '../Libraries/Network/NetInfo.js',
  '../Libraries/Interaction/PanResponder.js',
  '../Libraries/PermissionsAndroid/PermissionsAndroid.js',
  '../Libraries/Utilities/PixelRatio.js',
  '../Libraries/PushNotificationIOS/PushNotificationIOS.js',
  '../Libraries/Settings/Settings.ios.js',
  '../Libraries/Share/Share.js',
  '../Libraries/Components/StatusBar/StatusBarIOS.ios.js',
  '../Libraries/StyleSheet/StyleSheet.js',
  '../Libraries/Performance/Systrace.js',
  '../Libraries/Components/TimePickerAndroid/TimePickerAndroid.android.js',
  '../Libraries/Components/ToastAndroid/ToastAndroid.android.js',
  '../Libraries/Vibration/Vibration.js',
  '../Libraries/Vibration/VibrationIOS.ios.js',
];

const stylesWithPermalink = [
  '../Libraries/StyleSheet/LayoutPropTypes.js',
  '../Libraries/StyleSheet/TransformPropTypes.js',
  '../Libraries/Components/View/ShadowPropTypesIOS.js',
];

const stylesForEmbed = [
  '../Libraries/Components/View/ViewStylePropTypes.js',
  '../Libraries/Text/TextStylePropTypes.js',
  '../Libraries/Image/ImageStylePropTypes.js',
];

module.exports = {
  components,
  apis,
  stylesWithPermalink,
  stylesForEmbed,
};
