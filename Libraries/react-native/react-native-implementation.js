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

import typeof AccessibilityInfo from '../Components/AccessibilityInfo/AccessibilityInfo';
import typeof ActivityIndicator from '../Components/ActivityIndicator/ActivityIndicator';
import typeof ReactNativeART from '../ART/ReactNativeART';
import typeof Button from '../Components/Button';
import typeof CheckBox from '../Components/CheckBox/CheckBox';
import typeof DatePickerIOS from '../Components/DatePicker/DatePickerIOS';
import typeof DrawerLayoutAndroid from '../Components/DrawerAndroid/DrawerLayoutAndroid';
import typeof FlatList from '../Lists/FlatList';
import typeof Image from '../Image/Image';
import typeof ImageBackground from '../Image/ImageBackground';
import typeof InputAccessoryView from '../Components/TextInput/InputAccessoryView';
import typeof KeyboardAvoidingView from '../Components/Keyboard/KeyboardAvoidingView';
import typeof MaskedViewIOS from '../Components/MaskedView/MaskedViewIOS';
import typeof Modal from '../Modal/Modal';
import typeof Picker from '../Components/Picker/Picker';
import typeof PickerIOS from '../Components/Picker/PickerIOS';
import typeof ProgressBarAndroid from '../Components/ProgressBarAndroid/ProgressBarAndroid';
import typeof ProgressViewIOS from '../Components/ProgressViewIOS/ProgressViewIOS';
import typeof SafeAreaView from '../Components/SafeAreaView/SafeAreaView';
import typeof ScrollView from '../Components/ScrollView/ScrollView';
import typeof SectionList from '../Lists/SectionList';
import typeof SegmentedControlIOS from '../Components/SegmentedControlIOS/SegmentedControlIOS';
import typeof Slider from '../Components/Slider/Slider';
import typeof Switch from '../Components/Switch/Switch';
import typeof RefreshControl from '../Components/RefreshControl/RefreshControl';
import typeof StatusBar from '../Components/StatusBar/StatusBar';
import typeof Text from '../Text/Text';
import typeof TextInput from '../Components/TextInput/TextInput';
import typeof Touchable from '../Components/Touchable/Touchable';
import typeof TouchableHighlight from '../Components/Touchable/TouchableHighlight';
import typeof TouchableNativeFeedback from '../Components/Touchable/TouchableNativeFeedback';
import typeof TouchableOpacity from '../Components/Touchable/TouchableOpacity';
import typeof TouchableWithoutFeedback from '../Components/Touchable/TouchableWithoutFeedback';
import typeof View from '../Components/View/View';
import typeof VirtualizedList from '../Lists/VirtualizedList';
import typeof VirtualizedSectionList from '../Lists/VirtualizedSectionList';
import typeof ActionSheetIOS from '../ActionSheetIOS/ActionSheetIOS';
import typeof Alert from '../Alert/Alert';
import typeof Animated from '../Animated/src/Animated';
import typeof Appearance from '../Utilities/Appearance';
import typeof AppRegistry from '../ReactNative/AppRegistry';
import typeof AppState from '../AppState/AppState';
import typeof AsyncStorage from '../Storage/AsyncStorage';
import typeof BackHandler from '../Utilities/BackHandler';
import typeof Clipboard from '../Components/Clipboard/Clipboard';
import typeof DatePickerAndroid from '../Components/DatePickerAndroid/DatePickerAndroid';
import typeof DeviceInfo from '../Utilities/DeviceInfo';
import typeof Dimensions from '../Utilities/Dimensions';
import typeof Easing from '../Animated/src/Easing';
import typeof ReactNative from '../Renderer/shims/ReactNative';
import typeof I18nManager from '../ReactNative/I18nManager';
import typeof ImagePickerIOS from '../Image/ImagePickerIOS';
import typeof InteractionManager from '../Interaction/InteractionManager';
import typeof Keyboard from '../Components/Keyboard/Keyboard';
import typeof LayoutAnimation from '../LayoutAnimation/LayoutAnimation';
import typeof Linking from '../Linking/Linking';
import typeof NativeDialogManagerAndroid from '../NativeModules/specs/NativeDialogManagerAndroid';
import typeof NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import typeof Networking from '../Network/RCTNetworking';
import typeof PanResponder from '../Interaction/PanResponder';
import typeof PermissionsAndroid from '../PermissionsAndroid/PermissionsAndroid';
import typeof PixelRatio from '../Utilities/PixelRatio';
import typeof PushNotificationIOS from '../PushNotificationIOS/PushNotificationIOS';
import typeof Settings from '../Settings/Settings';
import typeof Share from '../Share/Share';
import typeof StatusBarIOS from '../Components/StatusBar/StatusBarIOS';
import typeof StyleSheet from '../StyleSheet/StyleSheet';
import typeof Systrace from '../Performance/Systrace';
import typeof TimePickerAndroid from '../Components/TimePickerAndroid/TimePickerAndroid';
import typeof ToastAndroid from '../Components/ToastAndroid/ToastAndroid';
import typeof * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';
import typeof TVEventHandler from '../Components/AppleTV/TVEventHandler';
import typeof UIManager from '../ReactNative/UIManager';
import typeof useColorScheme from '../Utilities/useColorScheme';
import typeof useWindowDimensions from '../Utilities/useWindowDimensions';
import typeof UTFSequence from '../UTFSequence';
import typeof Vibration from '../Vibration/Vibration';
import typeof YellowBox from '../YellowBox/YellowBox';
import typeof RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import typeof RCTNativeAppEventEmitter from '../EventEmitter/RCTNativeAppEventEmitter';
import typeof NativeModules from '../BatchedBridge/NativeModules';
import typeof Platform from '../Utilities/Platform';
import typeof processColor from '../StyleSheet/processColor';
import typeof requireNativeComponent from '../ReactNative/requireNativeComponent';
import typeof RootTagContext from '../ReactNative/RootTagContext';
import typeof DeprecatedColorPropType from '../DeprecatedPropTypes/DeprecatedColorPropType';
import typeof DeprecatedEdgeInsetsPropType from '../DeprecatedPropTypes/DeprecatedEdgeInsetsPropType';
import typeof DeprecatedPointPropType from '../DeprecatedPropTypes/DeprecatedPointPropType';
import typeof DeprecatedViewPropTypes from '../DeprecatedPropTypes/DeprecatedViewPropTypes';

const invariant = require('invariant');
const warnOnce = require('../Utilities/warnOnce');

// Export React, plus some native additions.
module.exports = {
  // Components
  get AccessibilityInfo(): AccessibilityInfo {
    return require('../Components/AccessibilityInfo/AccessibilityInfo');
  },
  get ActivityIndicator(): ActivityIndicator {
    return require('../Components/ActivityIndicator/ActivityIndicator');
  },
  get ART(): ReactNativeART {
    warnOnce(
      'art-moved',
      'React Native ART has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/art' instead of 'react-native'. " +
        'See https://github.com/react-native-community/art',
    );
    return require('../ART/ReactNativeART');
  },
  get Button(): Button {
    return require('../Components/Button');
  },
  get CheckBox(): CheckBox {
    warnOnce(
      'checkBox-moved',
      'CheckBox has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/checkbox' instead of 'react-native'. " +
        'See https://github.com/react-native-community/react-native-checkbox',
    );
    return require('../Components/CheckBox/CheckBox');
  },
  get DatePickerIOS(): DatePickerIOS {
    warnOnce(
      'DatePickerIOS-merged',
      'DatePickerIOS has been merged with DatePickerAndroid and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " +
        'See https://github.com/react-native-community/react-native-datetimepicker',
    );
    return require('../Components/DatePicker/DatePickerIOS');
  },
  get DrawerLayoutAndroid(): DrawerLayoutAndroid {
    return require('../Components/DrawerAndroid/DrawerLayoutAndroid');
  },
  get FlatList(): FlatList {
    return require('../Lists/FlatList');
  },
  get Image(): Image {
    return require('../Image/Image');
  },
  get ImageBackground(): ImageBackground {
    return require('../Image/ImageBackground');
  },
  get InputAccessoryView(): InputAccessoryView {
    return require('../Components/TextInput/InputAccessoryView');
  },
  get KeyboardAvoidingView(): KeyboardAvoidingView {
    return require('../Components/Keyboard/KeyboardAvoidingView');
  },
  get MaskedViewIOS(): MaskedViewIOS {
    warnOnce(
      'maskedviewios-moved',
      'MaskedViewIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/masked-view' instead of 'react-native'. " +
        'See https://github.com/react-native-community/react-native-masked-view',
    );
    return require('../Components/MaskedView/MaskedViewIOS');
  },
  get Modal(): Modal {
    return require('../Modal/Modal');
  },
  get Picker(): Picker {
    warnOnce(
      'picker-moved',
      'Picker has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/picker' instead of 'react-native'. " +
        'See https://github.com/react-native-community/react-native-picker',
    );
    return require('../Components/Picker/Picker');
  },
  get PickerIOS(): PickerIOS {
    warnOnce(
      'pickerios-moved',
      'PickerIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/picker' instead of 'react-native'. " +
        'See https://github.com/react-native-community/react-native-picker',
    );
    return require('../Components/Picker/PickerIOS');
  },
  get ProgressBarAndroid(): ProgressBarAndroid {
    return require('../Components/ProgressBarAndroid/ProgressBarAndroid');
  },
  get ProgressViewIOS(): ProgressViewIOS {
    return require('../Components/ProgressViewIOS/ProgressViewIOS');
  },
  get SafeAreaView(): SafeAreaView {
    return require('../Components/SafeAreaView/SafeAreaView');
  },
  get ScrollView(): ScrollView {
    return require('../Components/ScrollView/ScrollView');
  },
  get SectionList(): SectionList {
    return require('../Lists/SectionList');
  },
  get SegmentedControlIOS(): SegmentedControlIOS {
    return require('../Components/SegmentedControlIOS/SegmentedControlIOS');
  },
  get Slider(): Slider {
    warnOnce(
      'slider-moved',
      'Slider has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/slider' instead of 'react-native'. " +
        'See https://github.com/react-native-community/react-native-slider',
    );
    return require('../Components/Slider/Slider');
  },
  get Switch(): Switch {
    return require('../Components/Switch/Switch');
  },
  get RefreshControl(): RefreshControl {
    return require('../Components/RefreshControl/RefreshControl');
  },
  get StatusBar(): StatusBar {
    return require('../Components/StatusBar/StatusBar');
  },
  get Text(): Text {
    return require('../Text/Text');
  },
  get TextInput(): TextInput {
    return require('../Components/TextInput/TextInput');
  },
  get Touchable(): Touchable {
    return require('../Components/Touchable/Touchable');
  },
  get TouchableHighlight(): TouchableHighlight {
    return require('../Components/Touchable/TouchableHighlight');
  },
  get TouchableNativeFeedback(): TouchableNativeFeedback {
    return require('../Components/Touchable/TouchableNativeFeedback');
  },
  get TouchableOpacity(): TouchableOpacity {
    return require('../Components/Touchable/TouchableOpacity');
  },
  get TouchableWithoutFeedback(): TouchableWithoutFeedback {
    return require('../Components/Touchable/TouchableWithoutFeedback');
  },
  get View(): View {
    return require('../Components/View/View');
  },
  get VirtualizedList(): VirtualizedList {
    return require('../Lists/VirtualizedList');
  },
  get VirtualizedSectionList(): VirtualizedSectionList {
    return require('../Lists/VirtualizedSectionList');
  },

  // APIs
  get ActionSheetIOS(): ActionSheetIOS {
    return require('../ActionSheetIOS/ActionSheetIOS');
  },
  get Alert(): Alert {
    return require('../Alert/Alert');
  },
  get Animated(): Animated {
    return require('../Animated/src/Animated');
  },
  get Appearance(): Appearance {
    return require('../Utilities/Appearance');
  },
  get AppRegistry(): AppRegistry {
    return require('../ReactNative/AppRegistry');
  },
  get AppState(): AppState {
    return require('../AppState/AppState');
  },
  get AsyncStorage(): AsyncStorage {
    warnOnce(
      'async-storage-moved',
      'AsyncStorage has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/async-storage' instead of 'react-native'. " +
        'See https://github.com/react-native-community/react-native-async-storage',
    );
    return require('../Storage/AsyncStorage');
  },
  get BackHandler(): BackHandler {
    return require('../Utilities/BackHandler');
  },
  get Clipboard(): Clipboard {
    return require('../Components/Clipboard/Clipboard');
  },
  get DatePickerAndroid(): DatePickerAndroid {
    warnOnce(
      'DatePickerAndroid-merged',
      'DatePickerAndroid has been merged with DatePickerIOS and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " +
        'See https://github.com/react-native-community/react-native-datetimepicker',
    );
    return require('../Components/DatePickerAndroid/DatePickerAndroid');
  },
  get DeviceInfo(): DeviceInfo {
    return require('../Utilities/DeviceInfo');
  },
  get Dimensions(): Dimensions {
    return require('../Utilities/Dimensions');
  },
  get Easing(): Easing {
    return require('../Animated/src/Easing');
  },
  get findNodeHandle(): $PropertyType<ReactNative, 'findNodeHandle'> {
    return require('../Renderer/shims/ReactNative').findNodeHandle;
  },
  get I18nManager(): I18nManager {
    return require('../ReactNative/I18nManager');
  },
  get ImagePickerIOS(): ImagePickerIOS {
    warnOnce(
      'imagePickerIOS-moved',
      'ImagePickerIOS has been extracted from react-native core and will be removed in a future release. ' +
        "Please upgrade to use either '@react-native-community/react-native-image-picker' or 'expo-image-picker'. " +
        "If you cannot upgrade to a different library, please install the deprecated '@react-native-community/image-picker-ios' package. " +
        'See https://github.com/react-native-community/react-native-image-picker-ios',
    );
    return require('../Image/ImagePickerIOS');
  },
  get InteractionManager(): InteractionManager {
    return require('../Interaction/InteractionManager');
  },
  get Keyboard(): Keyboard {
    return require('../Components/Keyboard/Keyboard');
  },
  get LayoutAnimation(): LayoutAnimation {
    return require('../LayoutAnimation/LayoutAnimation');
  },
  get Linking(): Linking {
    return require('../Linking/Linking');
  },
  get NativeDialogManagerAndroid(): NativeDialogManagerAndroid {
    return require('../NativeModules/specs/NativeDialogManagerAndroid').default;
  },
  get NativeEventEmitter(): NativeEventEmitter {
    return require('../EventEmitter/NativeEventEmitter');
  },
  get Networking(): Networking {
    return require('../Network/RCTNetworking');
  },
  get PanResponder(): PanResponder {
    return require('../Interaction/PanResponder');
  },
  get PermissionsAndroid(): PermissionsAndroid {
    return require('../PermissionsAndroid/PermissionsAndroid');
  },
  get PixelRatio(): PixelRatio {
    return require('../Utilities/PixelRatio');
  },
  get PushNotificationIOS(): PushNotificationIOS {
    warnOnce(
      'pushNotificationIOS-moved',
      'PushNotificationIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/push-notification-ios' instead of 'react-native'. " +
        'See https://github.com/react-native-community/react-native-push-notification-ios',
    );
    return require('../PushNotificationIOS/PushNotificationIOS');
  },
  get Settings(): Settings {
    return require('../Settings/Settings');
  },
  get Share(): Share {
    return require('../Share/Share');
  },
  get StatusBarIOS(): StatusBarIOS {
    warnOnce(
      'StatusBarIOS-merged',
      'StatusBarIOS has been merged with StatusBar and will be removed in a future release. Use StatusBar for mutating the status bar',
    );
    return require('../Components/StatusBar/StatusBarIOS');
  },
  get StyleSheet(): StyleSheet {
    return require('../StyleSheet/StyleSheet');
  },
  get Systrace(): Systrace {
    return require('../Performance/Systrace');
  },
  get TimePickerAndroid(): TimePickerAndroid {
    warnOnce(
      'TimePickerAndroid-merged',
      'TimePickerAndroid has been merged with DatePickerIOS and DatePickerAndroid and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " +
        'See https://github.com/react-native-community/react-native-datetimepicker',
    );
    return require('../Components/TimePickerAndroid/TimePickerAndroid');
  },
  get ToastAndroid(): ToastAndroid {
    return require('../Components/ToastAndroid/ToastAndroid');
  },
  get TurboModuleRegistry(): TurboModuleRegistry {
    return require('../TurboModule/TurboModuleRegistry');
  },
  get TVEventHandler(): TVEventHandler {
    return require('../Components/AppleTV/TVEventHandler');
  },
  get UIManager(): UIManager {
    return require('../ReactNative/UIManager');
  },
  get unstable_batchedUpdates(): $PropertyType<
    ReactNative,
    'unstable_batchedUpdates',
  > {
    return require('../Renderer/shims/ReactNative').unstable_batchedUpdates;
  },
  get useColorScheme(): useColorScheme {
    return require('../Utilities/useColorScheme').default;
  },
  get useWindowDimensions(): useWindowDimensions {
    return require('../Utilities/useWindowDimensions').default;
  },
  get UTFSequence(): UTFSequence {
    return require('../UTFSequence');
  },
  get Vibration(): Vibration {
    return require('../Vibration/Vibration');
  },
  get YellowBox(): YellowBox {
    return require('../YellowBox/YellowBox');
  },

  // Plugins
  get DeviceEventEmitter(): RCTDeviceEventEmitter {
    return require('../EventEmitter/RCTDeviceEventEmitter');
  },
  get NativeAppEventEmitter(): RCTNativeAppEventEmitter {
    return require('../EventEmitter/RCTNativeAppEventEmitter');
  },
  get NativeModules(): NativeModules {
    return require('../BatchedBridge/NativeModules');
  },
  get Platform(): Platform {
    return require('../Utilities/Platform');
  },
  get processColor(): processColor {
    return require('../StyleSheet/processColor');
  },
  get requireNativeComponent(): requireNativeComponent {
    return require('../ReactNative/requireNativeComponent');
  },
  get unstable_RootTagContext(): RootTagContext {
    return require('../ReactNative/RootTagContext');
  },

  // Prop Types
  get ColorPropType(): DeprecatedColorPropType {
    return require('../DeprecatedPropTypes/DeprecatedColorPropType');
  },
  get EdgeInsetsPropType(): DeprecatedEdgeInsetsPropType {
    return require('../DeprecatedPropTypes/DeprecatedEdgeInsetsPropType');
  },
  get PointPropType(): DeprecatedPointPropType {
    return require('../DeprecatedPropTypes/DeprecatedPointPropType');
  },
  get ViewPropTypes(): DeprecatedViewPropTypes {
    return require('../DeprecatedPropTypes/DeprecatedViewPropTypes');
  },
};

if (__DEV__) {
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

  // $FlowFixMe This is intentional: Flow will error when attempting to access WebView.
  Object.defineProperty(module.exports, 'WebView', {
    configurable: true,
    get() {
      invariant(
        false,
        'WebView has been removed from React Native. ' +
          "It can now be installed and imported from 'react-native-webview' instead of 'react-native'. " +
          'See https://github.com/react-native-community/react-native-webview',
      );
    },
  });

  // $FlowFixMe This is intentional: Flow will error when attempting to access NetInfo.
  Object.defineProperty(module.exports, 'NetInfo', {
    configurable: true,
    get() {
      invariant(
        false,
        'NetInfo has been removed from React Native. ' +
          "It can now be installed and imported from 'react-native-netinfo' instead of 'react-native'. " +
          'See https://github.com/react-native-community/react-native-netinfo',
      );
    },
  });

  // $FlowFixMe This is intentional: Flow will error when attempting to access CameraRoll.
  Object.defineProperty(module.exports, 'CameraRoll', {
    configurable: true,
    get() {
      invariant(
        false,
        'CameraRoll has been removed from React Native. ' +
          "It can now be installed and imported from 'react-native-cameraroll' instead of 'react-native'. " +
          'See https://github.com/react-native-community/react-native-cameraroll',
      );
    },
  });

  // $FlowFixMe This is intentional: Flow will error when attempting to access ImageStore.
  Object.defineProperty(module.exports, 'ImageStore', {
    configurable: true,
    get() {
      invariant(
        false,
        'ImageStore has been removed from React Native. ' +
          'To get a base64-encoded string from a local image use either of the following third-party libraries:' +
          "* expo-file-system: `readAsStringAsync(filepath, 'base64')`" +
          "* react-native-fs: `readFile(filepath, 'base64')`",
      );
    },
  });

  // $FlowFixMe This is intentional: Flow will error when attempting to access ImageEditor.
  Object.defineProperty(module.exports, 'ImageEditor', {
    configurable: true,
    get() {
      invariant(
        false,
        'ImageEditor has been removed from React Native. ' +
          "It can now be installed and imported from 'react-native-image-editor' instead of 'react-native'. " +
          'See https://github.com/react-native-community/react-native-image-editor',
      );
    },
  });

  // $FlowFixMe This is intentional: Flow will error when attempting to access ViewPagerAndroid.
  Object.defineProperty(module.exports, 'ViewPagerAndroid', {
    configurable: true,
    get() {
      invariant(
        false,
        'ViewPagerAndroid has been removed from React Native. ' +
          "It can now be installed and imported from 'react-native-viewpager' instead of 'react-native'. " +
          'See https://github.com/react-native-community/react-native-viewpager',
      );
    },
  });
}
