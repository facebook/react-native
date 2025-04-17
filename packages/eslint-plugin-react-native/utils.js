/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * The correctness of paths is checked in the test file.
 * The assumption is that renaming/removing components shouldn't happen too often.
 * If a new component is added, it should be imported from the root.
 * If the path is not matched, the auto-fix won't be suggested.
 */
const publicAPIMapping = {
  'Libraries/Components/AccessibilityInfo/AccessibilityInfo':
    'AccessibilityInfo',
  'Libraries/Components/ActivityIndicator/ActivityIndicator':
    'ActivityIndicator',
  'Libraries/Components/Button': 'Button',
  'Libraries/Components/DrawerAndroid/DrawerLayoutAndroid':
    'DrawerLayoutAndroid',
  'Libraries/Components/LayoutConformance/LayoutConformance':
    'experimental_LayoutConformance',
  'Libraries/Lists/FlatList': 'FlatList',
  'Libraries/Image/Image': 'Image',
  'Libraries/Image/ImageBackground': 'ImageBackground',
  'Libraries/Components/TextInput/InputAccessoryView': 'InputAccessoryView',
  'Libraries/Components/Keyboard/KeyboardAvoidingView': 'KeyboardAvoidingView',
  'Libraries/Modal/Modal': 'Modal',
  'Libraries/Components/Pressable/Pressable': 'Pressable',
  'Libraries/Components/ProgressBarAndroid/ProgressBarAndroid':
    'ProgressBarAndroid',
  'Libraries/Components/RefreshControl/RefreshControl': 'RefreshControl',
  'Libraries/Components/SafeAreaView/SafeAreaView': 'SafeAreaView',
  'Libraries/Components/ScrollView/ScrollView': 'ScrollView',
  'Libraries/Lists/SectionList': 'SectionList',
  'Libraries/Components/StatusBar/StatusBar': 'StatusBar',
  'Libraries/Components/Switch/Switch': 'Switch',
  'Libraries/Text/Text': 'Text',
  'Libraries/Components/TextInput/TextInput': 'TextInput',
  'Libraries/Components/Touchable/Touchable': 'Touchable',
  'Libraries/Components/Touchable/TouchableHighlight': 'TouchableHighlight',
  'Libraries/Components/Touchable/TouchableNativeFeedback':
    'TouchableNativeFeedback',
  'Libraries/Components/Touchable/TouchableOpacity': 'TouchableOpacity',
  'Libraries/Components/Touchable/TouchableWithoutFeedback':
    'TouchableWithoutFeedback',
  'Libraries/Components/View/View': 'View',
  'Libraries/Lists/VirtualizedList': 'VirtualizedList',
  'Libraries/Lists/VirtualizedSectionList': 'VirtualizedSectionList',
  'Libraries/ActionSheetIOS/ActionSheetIOS': 'ActionSheetIOS',
  'Libraries/Alert/Alert': 'Alert',
  'Libraries/Animated/Animated': 'Animated',
  'Libraries/Utilities/Appearance': 'Appearance',
  'Libraries/ReactNative/AppRegistry': 'AppRegistry',
  'Libraries/AppState/AppState': 'AppState',
  'Libraries/Utilities/BackHandler': 'BackHandler',
  'Libraries/Components/Clipboard/Clipboard': 'Clipboard',
  'Libraries/Utilities/DeviceInfo': 'DeviceInfo',
  'src/private/devsupport/devmenu/DevMenu': 'DevMenu',
  'Libraries/Utilities/DevSettings': 'DevSettings',
  'Libraries/Utilities/Dimensions': 'Dimensions',
  'Libraries/Animated/Easing': 'Easing',
  'Libraries/ReactNative/I18nManager': 'I18nManager',
  'Libraries/Interaction/InteractionManager': 'InteractionManager',
  'Libraries/Components/Keyboard/Keyboard': 'Keyboard',
  'Libraries/LayoutAnimation/LayoutAnimation': 'LayoutAnimation',
  'Libraries/Linking/Linking': 'Linking',
  'Libraries/LogBox/LogBox': 'LogBox',
  'Libraries/NativeModules/specs/NativeDialogManagerAndroid':
    'NativeDialogManagerAndroid',
  'Libraries/EventEmitter/NativeEventEmitter': 'NativeEventEmitter',
  'Libraries/Network/RCTNetworking': 'Networking',
  'Libraries/Interaction/PanResponder': 'PanResponder',
  'Libraries/PermissionsAndroid/PermissionsAndroid': 'PermissionsAndroid',
  'Libraries/Utilities/PixelRatio': 'PixelRatio',
  'Libraries/PushNotificationIOS/PushNotificationIOS': 'PushNotificationIOS',
  'Libraries/Settings/Settings': 'Settings',
  'Libraries/Share/Share': 'Share',
  'Libraries/StyleSheet/StyleSheet': 'StyleSheet',
  'Libraries/Performance/Systrace': 'Systrace',
  'Libraries/Components/ToastAndroid/ToastAndroid': 'ToastAndroid',
  'Libraries/TurboModule/TurboModuleRegistry': 'TurboModuleRegistry',
  'Libraries/ReactNative/UIManager': 'UIManager',
  'Libraries/Animated/useAnimatedValue': 'useAnimatedValue',
  'Libraries/Utilities/useColorScheme': 'useColorScheme',
  'Libraries/Utilities/useWindowDimensions': 'useWindowDimensions',
  'Libraries/UTFSequence': 'UTFSequence',
  'Libraries/Vibration/Vibration': 'Vibration',
  'Libraries/Utilities/codegenNativeComponent': 'codegenNativeComponent',
  'Libraries/Utilities/codegenNativeCommands': 'codegenNativeCommands',
  'Libraries/EventEmitter/RCTDeviceEventEmitter': 'DeviceEventEmitter',
  'Libraries/StyleSheet/PlatformColorValueTypesIOS': 'DynamicColorIOS',
  'Libraries/EventEmitter/RCTNativeAppEventEmitter': 'NativeAppEventEmitter',
  'Libraries/BatchedBridge/NativeModules': 'NativeModules',
  'Libraries/Utilities/Platform': 'Platform',
  'Libraries/StyleSheet/PlatformColorValueTypes': 'PlatformColor',
  'Libraries/StyleSheet/processColor': 'processColor',
  'Libraries/ReactNative/requireNativeComponent': 'requireNativeComponent',
  'Libraries/ReactNative/RootTag': 'RootTagContext',
};

module.exports = {
  publicAPIMapping,
};
