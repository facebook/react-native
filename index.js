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
import typeof AccessibilityInfo from './Libraries/Components/AccessibilityInfo/AccessibilityInfo';
import typeof ActivityIndicator from './Libraries/Components/ActivityIndicator/ActivityIndicator';
import typeof Button from './Libraries/Components/Button';
import typeof DatePickerIOS from './Libraries/Components/DatePicker/DatePickerIOS';
import typeof DrawerLayoutAndroid from './Libraries/Components/DrawerAndroid/DrawerLayoutAndroid';
import typeof FlatList from './Libraries/Lists/FlatList';
import typeof Image from './Libraries/Image/Image';
import typeof ImageBackground from './Libraries/Image/ImageBackground';
import typeof InputAccessoryView from './Libraries/Components/TextInput/InputAccessoryView';
import typeof KeyboardAvoidingView from './Libraries/Components/Keyboard/KeyboardAvoidingView';
import typeof MaskedViewIOS from './Libraries/Components/MaskedView/MaskedViewIOS';
import typeof Modal from './Libraries/Modal/Modal';
import typeof Picker from './Libraries/Components/Picker/Picker';
import typeof PickerIOS from './Libraries/Components/Picker/PickerIOS';
import typeof Pressable from './Libraries/Components/Pressable/Pressable';
import typeof ProgressBarAndroid from './Libraries/Components/ProgressBarAndroid/ProgressBarAndroid';
import typeof ProgressViewIOS from './Libraries/Components/ProgressViewIOS/ProgressViewIOS';
import typeof RefreshControl from './Libraries/Components/RefreshControl/RefreshControl';
import typeof SafeAreaView from './Libraries/Components/SafeAreaView/SafeAreaView';
import typeof ScrollView from './Libraries/Components/ScrollView/ScrollView';
import typeof SectionList from './Libraries/Lists/SectionList';
import typeof SegmentedControlIOS from './Libraries/Components/SegmentedControlIOS/SegmentedControlIOS';
import typeof Slider from './Libraries/Components/Slider/Slider';
import typeof StatusBar from './Libraries/Components/StatusBar/StatusBar';
import typeof Switch from './Libraries/Components/Switch/Switch';
import typeof Text from './Libraries/Text/Text';
import typeof TextInput from './Libraries/Components/TextInput/TextInput';
import typeof Touchable from './Libraries/Components/Touchable/Touchable';
import typeof TouchableHighlight from './Libraries/Components/Touchable/TouchableHighlight';
import typeof TouchableNativeFeedback from './Libraries/Components/Touchable/TouchableNativeFeedback';
import typeof TouchableOpacity from './Libraries/Components/Touchable/TouchableOpacity';
import typeof TouchableWithoutFeedback from './Libraries/Components/Touchable/TouchableWithoutFeedback';
import typeof View from './Libraries/Components/View/View';
import typeof VirtualizedList from './Libraries/Lists/VirtualizedList';
import typeof VirtualizedSectionList from './Libraries/Lists/VirtualizedSectionList';

// APIs
import typeof ActionSheetIOS from './Libraries/ActionSheetIOS/ActionSheetIOS';
import typeof Alert from './Libraries/Alert/Alert';
import typeof Animated from './Libraries/Animated/Animated';
import typeof Appearance from './Libraries/Utilities/Appearance';
import typeof AppRegistry from './Libraries/ReactNative/AppRegistry';
import typeof AppState from './Libraries/AppState/AppState';
import typeof AsyncStorage from './Libraries/Storage/AsyncStorage';
import typeof BackHandler from './Libraries/Utilities/BackHandler';
import typeof Clipboard from './Libraries/Components/Clipboard/Clipboard';
import typeof DatePickerAndroid from './Libraries/Components/DatePickerAndroid/DatePickerAndroid';
import typeof DeviceInfo from './Libraries/Utilities/DeviceInfo';
import typeof DevSettings from './Libraries/Utilities/DevSettings';
import typeof Dimensions from './Libraries/Utilities/Dimensions';
import typeof Easing from './Libraries/Animated/Easing';
import typeof ReactNative from './Libraries/Renderer/shims/ReactNative';
import typeof I18nManager from './Libraries/ReactNative/I18nManager';
import typeof ImagePickerIOS from './Libraries/Image/ImagePickerIOS';
import typeof InteractionManager from './Libraries/Interaction/InteractionManager';
import typeof Keyboard from './Libraries/Components/Keyboard/Keyboard';
import typeof LayoutAnimation from './Libraries/LayoutAnimation/LayoutAnimation';
import typeof Linking from './Libraries/Linking/Linking';
import typeof LogBox from './Libraries/LogBox/LogBox';
import typeof NativeDialogManagerAndroid from './Libraries/NativeModules/specs/NativeDialogManagerAndroid';
import typeof NativeEventEmitter from './Libraries/EventEmitter/NativeEventEmitter';
import typeof Networking from './Libraries/Network/RCTNetworking';
import typeof PanResponder from './Libraries/Interaction/PanResponder';
import typeof PermissionsAndroid from './Libraries/PermissionsAndroid/PermissionsAndroid';
import typeof PixelRatio from './Libraries/Utilities/PixelRatio';
import typeof PushNotificationIOS from './Libraries/PushNotificationIOS/PushNotificationIOS';
import typeof Settings from './Libraries/Settings/Settings';
import typeof Share from './Libraries/Share/Share';
import typeof StatusBarIOS from './Libraries/Components/StatusBar/StatusBarIOS';
import typeof StyleSheet from './Libraries/StyleSheet/StyleSheet';
import typeof Systrace from './Libraries/Performance/Systrace';
import typeof ToastAndroid from './Libraries/Components/ToastAndroid/ToastAndroid';
import typeof * as TurboModuleRegistry from './Libraries/TurboModule/TurboModuleRegistry';
import typeof UIManager from './Libraries/ReactNative/UIManager';
import typeof useColorScheme from './Libraries/Utilities/useColorScheme';
import typeof useWindowDimensions from './Libraries/Utilities/useWindowDimensions';
import typeof UTFSequence from './Libraries/UTFSequence';
import typeof Vibration from './Libraries/Vibration/Vibration';
import typeof YellowBox from './Libraries/YellowBox/YellowBoxDeprecated';

// Plugins
import typeof {DynamicColorIOS} from './Libraries/StyleSheet/PlatformColorValueTypesIOS';
import typeof NativeModules from './Libraries/BatchedBridge/NativeModules';
import typeof Platform from './Libraries/Utilities/Platform';
import typeof {PlatformColor} from './Libraries/StyleSheet/PlatformColorValueTypes';
import typeof processColor from './Libraries/StyleSheet/processColor';
import typeof RCTDeviceEventEmitter from './Libraries/EventEmitter/RCTDeviceEventEmitter';
import typeof RCTNativeAppEventEmitter from './Libraries/EventEmitter/RCTNativeAppEventEmitter';
import typeof {RootTagContext} from './Libraries/ReactNative/RootTag';

// Prop Types
import typeof DeprecatedColorPropType from './Libraries/DeprecatedPropTypes/DeprecatedColorPropType';
import typeof DeprecatedEdgeInsetsPropType from './Libraries/DeprecatedPropTypes/DeprecatedEdgeInsetsPropType';
import typeof DeprecatedPointPropType from './Libraries/DeprecatedPropTypes/DeprecatedPointPropType';
import typeof DeprecatedViewPropTypes from './Libraries/DeprecatedPropTypes/DeprecatedViewPropTypes';

import type {HostComponent as _HostComponentInternal} from './Libraries/Renderer/shims/ReactNativeTypes';

export type HostComponent<T> = _HostComponentInternal<T>;

const invariant = require('invariant');
const warnOnce = require('./Libraries/Utilities/warnOnce');

module.exports = {
  // Components
  get AccessibilityInfo(): AccessibilityInfo {
    return require('./Libraries/Components/AccessibilityInfo/AccessibilityInfo')
      .default;
  },
  get ActivityIndicator(): ActivityIndicator {
    return require('./Libraries/Components/ActivityIndicator/ActivityIndicator');
  },
  get Button(): Button {
    return require('./Libraries/Components/Button');
  },
  // $FlowFixMe[value-as-type]
  get DatePickerIOS(): DatePickerIOS {
    warnOnce(
      'DatePickerIOS-merged',
      'DatePickerIOS has been merged with DatePickerAndroid and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " +
        'See https://github.com/react-native-datetimepicker/datetimepicker',
    );
    return require('./Libraries/Components/DatePicker/DatePickerIOS');
  },
  // $FlowFixMe[value-as-type]
  get DrawerLayoutAndroid(): DrawerLayoutAndroid {
    return require('./Libraries/Components/DrawerAndroid/DrawerLayoutAndroid');
  },
  get FlatList(): FlatList {
    return require('./Libraries/Lists/FlatList');
  },
  get Image(): Image {
    return require('./Libraries/Image/Image');
  },
  get ImageBackground(): ImageBackground {
    return require('./Libraries/Image/ImageBackground');
  },
  get InputAccessoryView(): InputAccessoryView {
    return require('./Libraries/Components/TextInput/InputAccessoryView');
  },
  get KeyboardAvoidingView(): KeyboardAvoidingView {
    return require('./Libraries/Components/Keyboard/KeyboardAvoidingView');
  },
  get MaskedViewIOS(): MaskedViewIOS {
    warnOnce(
      'maskedviewios-moved',
      'MaskedViewIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-masked-view/masked-view' instead of 'react-native'. " +
        'See https://github.com/react-native-masked-view/masked-view',
    );
    return require('./Libraries/Components/MaskedView/MaskedViewIOS');
  },
  get Modal(): Modal {
    return require('./Libraries/Modal/Modal');
  },
  get Picker(): Picker {
    warnOnce(
      'picker-moved',
      'Picker has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-picker/picker' instead of 'react-native'. " +
        'See https://github.com/react-native-picker/picker',
    );
    return require('./Libraries/Components/Picker/Picker');
  },
  // $FlowFixMe[value-as-type]
  get PickerIOS(): PickerIOS {
    warnOnce(
      'pickerios-moved',
      'PickerIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-picker/picker' instead of 'react-native'. " +
        'See https://github.com/react-native-picker/picker',
    );
    return require('./Libraries/Components/Picker/PickerIOS');
  },
  get Pressable(): Pressable {
    return require('./Libraries/Components/Pressable/Pressable').default;
  },
  // $FlowFixMe[value-as-type]
  get ProgressBarAndroid(): ProgressBarAndroid {
    warnOnce(
      'progress-bar-android-moved',
      'ProgressBarAndroid has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/progress-bar-android' instead of 'react-native'. " +
        'See https://github.com/react-native-progress-view/progress-bar-android',
    );
    return require('./Libraries/Components/ProgressBarAndroid/ProgressBarAndroid');
  },
  // $FlowFixMe[value-as-type]
  get ProgressViewIOS(): ProgressViewIOS {
    warnOnce(
      'progress-view-ios-moved',
      'ProgressViewIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/progress-view' instead of 'react-native'. " +
        'See https://github.com/react-native-progress-view/progress-view',
    );
    return require('./Libraries/Components/ProgressViewIOS/ProgressViewIOS');
  },
  get RefreshControl(): RefreshControl {
    return require('./Libraries/Components/RefreshControl/RefreshControl');
  },
  get SafeAreaView(): SafeAreaView {
    return require('./Libraries/Components/SafeAreaView/SafeAreaView').default;
  },
  get ScrollView(): ScrollView {
    return require('./Libraries/Components/ScrollView/ScrollView');
  },
  get SectionList(): SectionList {
    return require('./Libraries/Lists/SectionList').default;
  },
  // $FlowFixMe[value-as-type]
  get SegmentedControlIOS(): SegmentedControlIOS {
    warnOnce(
      'segmented-control-ios-moved',
      'SegmentedControlIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-segmented-control/segmented-control' instead of 'react-native'. " +
        'See https://github.com/react-native-segmented-control/segmented-control',
    );
    return require('./Libraries/Components/SegmentedControlIOS/SegmentedControlIOS');
  },
  get Slider(): Slider {
    warnOnce(
      'slider-moved',
      'Slider has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/slider' instead of 'react-native'. " +
        'See https://github.com/callstack/react-native-slider',
    );
    return require('./Libraries/Components/Slider/Slider');
  },
  get StatusBar(): StatusBar {
    return require('./Libraries/Components/StatusBar/StatusBar');
  },
  get Switch(): Switch {
    return require('./Libraries/Components/Switch/Switch');
  },
  get Text(): Text {
    return require('./Libraries/Text/Text');
  },
  get TextInput(): TextInput {
    return require('./Libraries/Components/TextInput/TextInput');
  },
  get Touchable(): Touchable {
    return require('./Libraries/Components/Touchable/Touchable');
  },
  get TouchableHighlight(): TouchableHighlight {
    return require('./Libraries/Components/Touchable/TouchableHighlight');
  },
  get TouchableNativeFeedback(): TouchableNativeFeedback {
    return require('./Libraries/Components/Touchable/TouchableNativeFeedback');
  },
  get TouchableOpacity(): TouchableOpacity {
    return require('./Libraries/Components/Touchable/TouchableOpacity');
  },
  get TouchableWithoutFeedback(): TouchableWithoutFeedback {
    return require('./Libraries/Components/Touchable/TouchableWithoutFeedback');
  },
  get View(): View {
    return require('./Libraries/Components/View/View');
  },
  get VirtualizedList(): VirtualizedList {
    return require('./Libraries/Lists/VirtualizedList');
  },
  get VirtualizedSectionList(): VirtualizedSectionList {
    return require('./Libraries/Lists/VirtualizedSectionList');
  },

  // APIs
  get ActionSheetIOS(): ActionSheetIOS {
    return require('./Libraries/ActionSheetIOS/ActionSheetIOS');
  },
  get Alert(): Alert {
    return require('./Libraries/Alert/Alert');
  },
  get Animated(): Animated {
    return require('./Libraries/Animated/Animated');
  },
  get Appearance(): Appearance {
    return require('./Libraries/Utilities/Appearance');
  },
  get AppRegistry(): AppRegistry {
    return require('./Libraries/ReactNative/AppRegistry');
  },
  get AppState(): AppState {
    return require('./Libraries/AppState/AppState');
  },
  // $FlowFixMe[value-as-type]
  get AsyncStorage(): AsyncStorage {
    warnOnce(
      'async-storage-moved',
      'AsyncStorage has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-async-storage/async-storage' instead of 'react-native'. " +
        'See https://github.com/react-native-async-storage/async-storage',
    );
    return require('./Libraries/Storage/AsyncStorage');
  },
  get BackHandler(): BackHandler {
    return require('./Libraries/Utilities/BackHandler');
  },
  get Clipboard(): Clipboard {
    warnOnce(
      'clipboard-moved',
      'Clipboard has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-clipboard/clipboard' instead of 'react-native'. " +
        'See https://github.com/react-native-clipboard/clipboard',
    );
    return require('./Libraries/Components/Clipboard/Clipboard');
  },
  get DatePickerAndroid(): DatePickerAndroid {
    warnOnce(
      'DatePickerAndroid-merged',
      'DatePickerAndroid has been merged with DatePickerIOS and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " +
        'See https://github.com/react-native-datetimepicker/datetimepicker',
    );
    return require('./Libraries/Components/DatePickerAndroid/DatePickerAndroid');
  },
  get DeviceInfo(): DeviceInfo {
    return require('./Libraries/Utilities/DeviceInfo');
  },
  get DevSettings(): DevSettings {
    return require('./Libraries/Utilities/DevSettings');
  },
  get Dimensions(): Dimensions {
    return require('./Libraries/Utilities/Dimensions');
  },
  get Easing(): Easing {
    return require('./Libraries/Animated/Easing');
  },
  get findNodeHandle(): $PropertyType<ReactNative, 'findNodeHandle'> {
    return require('./Libraries/Renderer/shims/ReactNative').findNodeHandle;
  },
  get I18nManager(): I18nManager {
    return require('./Libraries/ReactNative/I18nManager');
  },
  get ImagePickerIOS(): ImagePickerIOS {
    warnOnce(
      'imagePickerIOS-moved',
      'ImagePickerIOS has been extracted from react-native core and will be removed in a future release. ' +
        "Please upgrade to use either '@react-native-community/react-native-image-picker' or 'expo-image-picker'. " +
        "If you cannot upgrade to a different library, please install the deprecated '@react-native-community/image-picker-ios' package. " +
        'See https://github.com/rnc-archive/react-native-image-picker-ios',
    );
    return require('./Libraries/Image/ImagePickerIOS');
  },
  get InteractionManager(): InteractionManager {
    return require('./Libraries/Interaction/InteractionManager');
  },
  get Keyboard(): Keyboard {
    return require('./Libraries/Components/Keyboard/Keyboard');
  },
  get LayoutAnimation(): LayoutAnimation {
    return require('./Libraries/LayoutAnimation/LayoutAnimation');
  },
  get Linking(): Linking {
    return require('./Libraries/Linking/Linking');
  },
  get LogBox(): LogBox {
    return require('./Libraries/LogBox/LogBox');
  },
  get NativeDialogManagerAndroid(): NativeDialogManagerAndroid {
    return require('./Libraries/NativeModules/specs/NativeDialogManagerAndroid')
      .default;
  },
  get NativeEventEmitter(): NativeEventEmitter {
    return require('./Libraries/EventEmitter/NativeEventEmitter').default;
  },
  get Networking(): Networking {
    return require('./Libraries/Network/RCTNetworking');
  },
  get PanResponder(): PanResponder {
    return require('./Libraries/Interaction/PanResponder');
  },
  get PermissionsAndroid(): PermissionsAndroid {
    return require('./Libraries/PermissionsAndroid/PermissionsAndroid');
  },
  get PixelRatio(): PixelRatio {
    return require('./Libraries/Utilities/PixelRatio');
  },
  get PushNotificationIOS(): PushNotificationIOS {
    warnOnce(
      'pushNotificationIOS-moved',
      'PushNotificationIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/push-notification-ios' instead of 'react-native'. " +
        'See https://github.com/react-native-push-notification-ios/push-notification-ios',
    );
    return require('./Libraries/PushNotificationIOS/PushNotificationIOS');
  },
  get Settings(): Settings {
    return require('./Libraries/Settings/Settings');
  },
  get Share(): Share {
    return require('./Libraries/Share/Share');
  },
  get StatusBarIOS(): StatusBarIOS {
    warnOnce(
      'StatusBarIOS-merged',
      'StatusBarIOS has been merged with StatusBar and will be removed in a future release. Use StatusBar for mutating the status bar',
    );
    return require('./Libraries/Components/StatusBar/StatusBarIOS');
  },
  get StyleSheet(): StyleSheet {
    return require('./Libraries/StyleSheet/StyleSheet');
  },
  get Systrace(): Systrace {
    return require('./Libraries/Performance/Systrace');
  },
  // $FlowFixMe[value-as-type]
  get ToastAndroid(): ToastAndroid {
    return require('./Libraries/Components/ToastAndroid/ToastAndroid');
  },
  get TurboModuleRegistry(): TurboModuleRegistry {
    return require('./Libraries/TurboModule/TurboModuleRegistry');
  },
  get UIManager(): UIManager {
    return require('./Libraries/ReactNative/UIManager');
  },
  get unstable_batchedUpdates(): $PropertyType<
    ReactNative,
    'unstable_batchedUpdates',
  > {
    return require('./Libraries/Renderer/shims/ReactNative')
      .unstable_batchedUpdates;
  },
  get useColorScheme(): useColorScheme {
    return require('./Libraries/Utilities/useColorScheme').default;
  },
  get useWindowDimensions(): useWindowDimensions {
    return require('./Libraries/Utilities/useWindowDimensions').default;
  },
  get UTFSequence(): UTFSequence {
    return require('./Libraries/UTFSequence');
  },
  get Vibration(): Vibration {
    return require('./Libraries/Vibration/Vibration');
  },
  get YellowBox(): YellowBox {
    return require('./Libraries/YellowBox/YellowBoxDeprecated');
  },

  // Plugins
  get DeviceEventEmitter(): RCTDeviceEventEmitter {
    return require('./Libraries/EventEmitter/RCTDeviceEventEmitter').default;
  },
  get DynamicColorIOS(): DynamicColorIOS {
    return require('./Libraries/StyleSheet/PlatformColorValueTypesIOS')
      .DynamicColorIOS;
  },
  get NativeAppEventEmitter(): RCTNativeAppEventEmitter {
    return require('./Libraries/EventEmitter/RCTNativeAppEventEmitter');
  },
  get NativeModules(): NativeModules {
    return require('./Libraries/BatchedBridge/NativeModules');
  },
  get Platform(): Platform {
    return require('./Libraries/Utilities/Platform');
  },
  get PlatformColor(): PlatformColor {
    return require('./Libraries/StyleSheet/PlatformColorValueTypes')
      .PlatformColor;
  },
  get processColor(): processColor {
    return require('./Libraries/StyleSheet/processColor');
  },
  get requireNativeComponent(): <T>(
    uiViewClassName: string,
  ) => HostComponent<T> {
    return require('./Libraries/ReactNative/requireNativeComponent');
  },
  get RootTagContext(): RootTagContext {
    return require('./Libraries/ReactNative/RootTag').RootTagContext;
  },
  get unstable_enableLogBox(): () => void {
    return () =>
      console.warn(
        'LogBox is enabled by default so there is no need to call unstable_enableLogBox() anymore. This is a no op and will be removed in the next version.',
      );
  },
  // Prop Types
  // $FlowFixMe[value-as-type]
  get ColorPropType(): DeprecatedColorPropType {
    return require('./Libraries/DeprecatedPropTypes/DeprecatedColorPropType');
  },
  get EdgeInsetsPropType(): DeprecatedEdgeInsetsPropType {
    return require('./Libraries/DeprecatedPropTypes/DeprecatedEdgeInsetsPropType');
  },
  get PointPropType(): DeprecatedPointPropType {
    return require('./Libraries/DeprecatedPropTypes/DeprecatedPointPropType');
  },
  get ViewPropTypes(): DeprecatedViewPropTypes {
    return require('./Libraries/DeprecatedPropTypes/DeprecatedViewPropTypes');
  },
};

if (__DEV__) {
  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access ART. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access ART. */
  Object.defineProperty(module.exports, 'ART', {
    configurable: true,
    get() {
      invariant(
        false,
        'ART has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-community/art' instead of 'react-native'. " +
          'See https://github.com/react-native-art/art',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access ListView. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access ListView. */
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

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access SwipeableListView. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access SwipeableListView. */
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

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access WebView. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access WebView. */
  Object.defineProperty(module.exports, 'WebView', {
    configurable: true,
    get() {
      invariant(
        false,
        'WebView has been removed from React Native. ' +
          "It can now be installed and imported from 'react-native-webview' instead of 'react-native'. " +
          'See https://github.com/react-native-webview/react-native-webview',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access NetInfo. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access NetInfo. */
  Object.defineProperty(module.exports, 'NetInfo', {
    configurable: true,
    get() {
      invariant(
        false,
        'NetInfo has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-community/netinfo' instead of 'react-native'. " +
          'See https://github.com/react-native-netinfo/react-native-netinfo',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access CameraRoll. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access CameraRoll. */
  Object.defineProperty(module.exports, 'CameraRoll', {
    configurable: true,
    get() {
      invariant(
        false,
        'CameraRoll has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-community/cameraroll' instead of 'react-native'. " +
          'See https://github.com/react-native-cameraroll/react-native-cameraroll',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access ImageStore. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access ImageStore. */
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

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access ImageEditor. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access ImageEditor. */
  Object.defineProperty(module.exports, 'ImageEditor', {
    configurable: true,
    get() {
      invariant(
        false,
        'ImageEditor has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-community/image-editor' instead of 'react-native'. " +
          'See https://github.com/callstack/react-native-image-editor',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access TimePickerAndroid. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access TimePickerAndroid. */
  Object.defineProperty(module.exports, 'TimePickerAndroid', {
    configurable: true,
    get() {
      invariant(
        false,
        'TimePickerAndroid has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " +
          'See https://github.com/react-native-datetimepicker/datetimepicker',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access ToolbarAndroid. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access ToolbarAndroid. */
  Object.defineProperty(module.exports, 'ToolbarAndroid', {
    configurable: true,
    get() {
      invariant(
        false,
        'ToolbarAndroid has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-community/toolbar-android' instead of 'react-native'. " +
          'See https://github.com/react-native-toolbar-android/toolbar-android',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access ViewPagerAndroid. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access ViewPagerAndroid. */
  Object.defineProperty(module.exports, 'ViewPagerAndroid', {
    configurable: true,
    get() {
      invariant(
        false,
        'ViewPagerAndroid has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-community/viewpager' instead of 'react-native'. " +
          'See https://github.com/callstack/react-native-viewpager',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access CheckBox. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access CheckBox. */
  Object.defineProperty(module.exports, 'CheckBox', {
    configurable: true,
    get() {
      invariant(
        false,
        'CheckBox has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-community/checkbox' instead of 'react-native'. " +
          'See https://github.com/react-native-checkbox/react-native-checkbox',
      );
    },
  });
}
