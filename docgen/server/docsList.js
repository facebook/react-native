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
  'build/Libraries/Components/ActivityIndicator/ActivityIndicator.js',
  'build/Libraries/Components/Button.js',
  'build/Libraries/Components/DatePicker/DatePickerIOS.ios.js',
  'build/Libraries/Components/DrawerAndroid/DrawerLayoutAndroid.android.js',
  'build/Libraries/Lists/FlatList.js',
  'build/Libraries/Image/Image.ios.js',
  'build/Libraries/Components/Keyboard/KeyboardAvoidingView.js',
  'build/Libraries/Lists/ListView/ListView.js',
  'build/Libraries/Components/MaskedView/MaskedViewIOS.ios.js',
  'build/Libraries/Modal/Modal.js',
  'build/Libraries/Components/Navigation/NavigatorIOS.ios.js',
  'build/Libraries/Components/Picker/Picker.js',
  'build/Libraries/Components/Picker/PickerIOS.ios.js',
  'build/Libraries/Components/ProgressBarAndroid/ProgressBarAndroid.android.js',
  'build/Libraries/Components/ProgressViewIOS/ProgressViewIOS.ios.js',
  'build/Libraries/Components/RefreshControl/RefreshControl.js',
  'build/Libraries/Components/ScrollView/ScrollView.js',
  'build/Libraries/Lists/SectionList.js',
  'build/Libraries/Components/SegmentedControlIOS/SegmentedControlIOS.ios.js',
  'build/Libraries/Components/Slider/Slider.js',
  'build/Libraries/RCTTest/SnapshotViewIOS.ios.js',
  'build/Libraries/Components/StatusBar/StatusBar.js',
  'build/Libraries/Components/Switch/Switch.js',
  'build/Libraries/Components/TabBarIOS/TabBarIOS.ios.js',
  'build/Libraries/Components/TabBarIOS/TabBarItemIOS.ios.js',
  'build/Libraries/Text/Text.js',
  'build/Libraries/Components/TextInput/TextInput.js',
  'build/Libraries/Components/ToolbarAndroid/ToolbarAndroid.android.js',
  'build/Libraries/Components/Touchable/TouchableHighlight.js',
  'build/Libraries/Components/Touchable/TouchableNativeFeedback.android.js',
  'build/Libraries/Components/Touchable/TouchableOpacity.js',
  'build/Libraries/Components/Touchable/TouchableWithoutFeedback.js',
  'build/Libraries/Components/View/View.js',
  'build/Libraries/Components/ViewPager/ViewPagerAndroid.android.js',
  'build/Libraries/Lists/VirtualizedList.js',
  'build/Libraries/Components/WebView/WebView.ios.js',
];

const apis = [
  'build/Libraries/Components/AccessibilityInfo/AccessibilityInfo.ios.js',
  'build/Libraries/ActionSheetIOS/ActionSheetIOS.js',
  'build/Libraries/Alert/Alert.js',
  'build/Libraries/Alert/AlertIOS.js',
  'build/Libraries/Animated/src/AnimatedImplementation.js',
  'build/Libraries/ReactNative/AppRegistry.js',
  'build/Libraries/AppState/AppState.js',
  'build/Libraries/Storage/AsyncStorage.js',
  'build/Libraries/Utilities/BackAndroid.js',
  'build/Libraries/Utilities/BackHandler.ios.js',
  'build/Libraries/Utilities/BackHandler.android.js',
  'build/Libraries/CameraRoll/CameraRoll.js',
  'build/Libraries/Components/Clipboard/Clipboard.js',
  'build/Libraries/Components/DatePickerAndroid/DatePickerAndroid.android.js',
  'build/Libraries/Utilities/Dimensions.js',
  'build/Libraries/Animated/src/Easing.js',
  'build/Libraries/Geolocation/Geolocation.js',
  'build/Libraries/Image/ImageEditor.js',
  'build/Libraries/CameraRoll/ImagePickerIOS.js',
  'build/Libraries/Image/ImageStore.js',
  'build/Libraries/Interaction/InteractionManager.js',
  'build/Libraries/Components/Keyboard/Keyboard.js',
  'build/Libraries/LayoutAnimation/LayoutAnimation.js',
  'build/Libraries/Linking/Linking.js',
  'build/Libraries/Lists/ListView/ListViewDataSource.js',
  'build/Libraries/Network/NetInfo.js',
  'build/Libraries/Interaction/PanResponder.js',
  'build/Libraries/PermissionsAndroid/PermissionsAndroid.js',
  'build/Libraries/Utilities/PixelRatio.js',
  'build/Libraries/PushNotificationIOS/PushNotificationIOS.js',
  'build/Libraries/Settings/Settings.ios.js',
  'build/Libraries/Share/Share.js',
  'build/Libraries/Components/StatusBar/StatusBarIOS.ios.js',
  'build/Libraries/StyleSheet/StyleSheet.js',
  'build/Libraries/Performance/Systrace.js',
  'build/Libraries/Components/TimePickerAndroid/TimePickerAndroid.android.js',
  'build/Libraries/Components/ToastAndroid/ToastAndroid.android.js',
  'build/Libraries/Vibration/Vibration.js',
  'build/Libraries/Vibration/VibrationIOS.ios.js',
];

const stylesForEmbed = [
  'build/Libraries/Components/View/ViewStylePropTypes.js',
  'build/Libraries/Text/TextStylePropTypes.js',
  'build/Libraries/Image/ImageStylePropTypes.js',
];

const stylesWithPermalink = [
  'build/Libraries/StyleSheet/LayoutPropTypes.js',
  'build/Libraries/StyleSheet/TransformPropTypes.js',
  'build/Libraries/Components/View/ShadowPropTypesIOS.js',
  'build/Libraries/Components/View/ViewPropTypes.js',
  ...stylesForEmbed,
];

const viewPropTypes = 'build/Libraries/Components/View/ViewPropTypes.js';

module.exports = {
  components,
  apis,
  stylesWithPermalink,
  stylesForEmbed,
  viewPropTypes,
};
