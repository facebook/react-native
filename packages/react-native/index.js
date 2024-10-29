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
'use client';

// APIs
import typeof ActionSheetIOS from './Libraries/ActionSheetIOS/ActionSheetIOS';
import typeof Alert from './Libraries/Alert/Alert';
import typeof Animated from './Libraries/Animated/Animated';
import typeof * as AnimatedModule from './Libraries/Animated/Animated';
import typeof Easing from './Libraries/Animated/Easing';
import typeof useAnimatedValue from './Libraries/Animated/useAnimatedValue';
import typeof AppState from './Libraries/AppState/AppState';
import typeof NativeModules from './Libraries/BatchedBridge/NativeModules';
// Components
import typeof AccessibilityInfo from './Libraries/Components/AccessibilityInfo/AccessibilityInfo';
import typeof ActivityIndicator from './Libraries/Components/ActivityIndicator/ActivityIndicator';
import typeof Button from './Libraries/Components/Button';
import typeof Clipboard from './Libraries/Components/Clipboard/Clipboard';
import typeof DrawerLayoutAndroid from './Libraries/Components/DrawerAndroid/DrawerLayoutAndroid';
import typeof Keyboard from './Libraries/Components/Keyboard/Keyboard';
import typeof KeyboardAvoidingView from './Libraries/Components/Keyboard/KeyboardAvoidingView';
import typeof Pressable from './Libraries/Components/Pressable/Pressable';
import typeof ProgressBarAndroid from './Libraries/Components/ProgressBarAndroid/ProgressBarAndroid';
import typeof RefreshControl from './Libraries/Components/RefreshControl/RefreshControl';
import typeof SafeAreaView from './Libraries/Components/SafeAreaView/SafeAreaView';
import typeof ScrollView from './Libraries/Components/ScrollView/ScrollView';
import typeof StatusBar from './Libraries/Components/StatusBar/StatusBar';
import typeof Switch from './Libraries/Components/Switch/Switch';
import typeof InputAccessoryView from './Libraries/Components/TextInput/InputAccessoryView';
import typeof TextInput from './Libraries/Components/TextInput/TextInput';
import typeof ToastAndroid from './Libraries/Components/ToastAndroid/ToastAndroid';
import typeof Touchable from './Libraries/Components/Touchable/Touchable';
import typeof TouchableHighlight from './Libraries/Components/Touchable/TouchableHighlight';
import typeof TouchableNativeFeedback from './Libraries/Components/Touchable/TouchableNativeFeedback';
import typeof TouchableOpacity from './Libraries/Components/Touchable/TouchableOpacity';
import typeof TouchableWithoutFeedback from './Libraries/Components/Touchable/TouchableWithoutFeedback';
import typeof View from './Libraries/Components/View/View';
import typeof RegisterCallableModule from './Libraries/Core/registerCallableModule';
import typeof NativeEventEmitter from './Libraries/EventEmitter/NativeEventEmitter';
import typeof RCTDeviceEventEmitter from './Libraries/EventEmitter/RCTDeviceEventEmitter';
import typeof RCTNativeAppEventEmitter from './Libraries/EventEmitter/RCTNativeAppEventEmitter';
import typeof Image from './Libraries/Image/Image';
import typeof ImageBackground from './Libraries/Image/ImageBackground';
import typeof InteractionManager from './Libraries/Interaction/InteractionManager';
import typeof PanResponder from './Libraries/Interaction/PanResponder';
import typeof LayoutAnimation from './Libraries/LayoutAnimation/LayoutAnimation';
import typeof Linking from './Libraries/Linking/Linking';
import typeof FlatList from './Libraries/Lists/FlatList';
import typeof SectionList from './Libraries/Lists/SectionList';
import typeof VirtualizedList from './Libraries/Lists/VirtualizedList';
import typeof VirtualizedSectionList from './Libraries/Lists/VirtualizedSectionList';
import typeof LogBox from './Libraries/LogBox/LogBox';
import typeof Modal from './Libraries/Modal/Modal';
// $FlowFixMe[invalid-exported-annotation]
import typeof NativeDialogManagerAndroid from './Libraries/NativeModules/specs/NativeDialogManagerAndroid';
import typeof Networking from './Libraries/Network/RCTNetworking';
import typeof * as Systrace from './Libraries/Performance/Systrace';
import typeof PermissionsAndroid from './Libraries/PermissionsAndroid/PermissionsAndroid';
import typeof PushNotificationIOS from './Libraries/PushNotificationIOS/PushNotificationIOS';
import typeof AppRegistry from './Libraries/ReactNative/AppRegistry';
import typeof I18nManager from './Libraries/ReactNative/I18nManager';
import typeof {RootTagContext} from './Libraries/ReactNative/RootTag';
import typeof UIManager from './Libraries/ReactNative/UIManager';
import typeof ReactNative from './Libraries/Renderer/shims/ReactNative';
import type {
  HostComponent,
  HostInstance,
} from './Libraries/Renderer/shims/ReactNativeTypes';
import typeof Settings from './Libraries/Settings/Settings';
import typeof Share from './Libraries/Share/Share';
import typeof {PlatformColor} from './Libraries/StyleSheet/PlatformColorValueTypes';
// Plugins
import typeof {DynamicColorIOS} from './Libraries/StyleSheet/PlatformColorValueTypesIOS';
import typeof processColor from './Libraries/StyleSheet/processColor';
import typeof StyleSheet from './Libraries/StyleSheet/StyleSheet';
import typeof Text from './Libraries/Text/Text';
import typeof * as TurboModuleRegistry from './Libraries/TurboModule/TurboModuleRegistry';
import typeof UTFSequence from './Libraries/UTFSequence';
import typeof * as Appearance from './Libraries/Utilities/Appearance';
import typeof BackHandler from './Libraries/Utilities/BackHandler';
import typeof DeviceInfo from './Libraries/Utilities/DeviceInfo';
import typeof DevSettings from './Libraries/Utilities/DevSettings';
import typeof Dimensions from './Libraries/Utilities/Dimensions';
import typeof PixelRatio from './Libraries/Utilities/PixelRatio';
import typeof Platform from './Libraries/Utilities/Platform';
import typeof useColorScheme from './Libraries/Utilities/useColorScheme';
import typeof useWindowDimensions from './Libraries/Utilities/useWindowDimensions';
import typeof Vibration from './Libraries/Vibration/Vibration';
import typeof YellowBox from './Libraries/YellowBox/YellowBoxDeprecated';
import typeof DevMenu from './src/private/devmenu/DevMenu';

const warnOnce = require('./Libraries/Utilities/warnOnce');
const invariant = require('invariant');

export type {HostComponent, HostInstance};

module.exports = {
  get registerCallableModule(): RegisterCallableModule {
    return require('./Libraries/Core/registerCallableModule').default;
  },
  // Components
  get AccessibilityInfo(): AccessibilityInfo {
    return require('./Libraries/Components/AccessibilityInfo/AccessibilityInfo')
      .default;
  },
  get ActivityIndicator(): ActivityIndicator {
    return require('./Libraries/Components/ActivityIndicator/ActivityIndicator')
      .default;
  },
  get Button(): Button {
    return require('./Libraries/Components/Button').default;
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
    return require('./Libraries/Components/TextInput/InputAccessoryView')
      .default;
  },
  get KeyboardAvoidingView(): KeyboardAvoidingView {
    return require('./Libraries/Components/Keyboard/KeyboardAvoidingView')
      .default;
  },
  get Modal(): Modal {
    return require('./Libraries/Modal/Modal');
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
  get StatusBar(): StatusBar {
    return require('./Libraries/Components/StatusBar/StatusBar');
  },
  get Switch(): Switch {
    return require('./Libraries/Components/Switch/Switch').default;
  },
  get Text(): Text {
    return require('./Libraries/Text/Text');
  },
  get TextInput(): TextInput {
    return require('./Libraries/Components/TextInput/TextInput');
  },
  get Touchable(): Touchable {
    return require('./Libraries/Components/Touchable/Touchable').default;
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
  // Include any types exported in the Animated module together with its default export, so
  // you can references types such as Animated.Numeric
  get Animated(): {...$Diff<AnimatedModule, {default: any}>, ...Animated} {
    // $FlowExpectedError[prop-missing]: we only return the default export, all other exports are types
    return require('./Libraries/Animated/Animated').default;
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
  get DeviceInfo(): DeviceInfo {
    return require('./Libraries/Utilities/DeviceInfo');
  },
  get DevMenu(): DevMenu {
    return require('./src/private/devmenu/DevMenu');
  },
  get DevSettings(): DevSettings {
    return require('./Libraries/Utilities/DevSettings');
  },
  get Dimensions(): Dimensions {
    return require('./Libraries/Utilities/Dimensions').default;
  },
  get Easing(): Easing {
    return require('./Libraries/Animated/Easing').default;
  },
  get findNodeHandle(): $PropertyType<ReactNative, 'findNodeHandle'> {
    return require('./Libraries/ReactNative/RendererProxy').findNodeHandle;
  },
  get I18nManager(): I18nManager {
    return require('./Libraries/ReactNative/I18nManager');
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
    return require('./Libraries/LogBox/LogBox').default;
  },
  get NativeDialogManagerAndroid(): NativeDialogManagerAndroid {
    return require('./Libraries/NativeModules/specs/NativeDialogManagerAndroid')
      .default;
  },
  get NativeEventEmitter(): NativeEventEmitter {
    return require('./Libraries/EventEmitter/NativeEventEmitter').default;
  },
  get Networking(): Networking {
    return require('./Libraries/Network/RCTNetworking').default;
  },
  get PanResponder(): PanResponder {
    return require('./Libraries/Interaction/PanResponder').default;
  },
  get PermissionsAndroid(): PermissionsAndroid {
    return require('./Libraries/PermissionsAndroid/PermissionsAndroid');
  },
  get PixelRatio(): PixelRatio {
    return require('./Libraries/Utilities/PixelRatio').default;
  },
  get PushNotificationIOS(): PushNotificationIOS {
    warnOnce(
      'pushNotificationIOS-moved',
      'PushNotificationIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/push-notification-ios' instead of 'react-native'. " +
        'See https://github.com/react-native-push-notification/ios',
    );
    return require('./Libraries/PushNotificationIOS/PushNotificationIOS');
  },
  get Settings(): Settings {
    return require('./Libraries/Settings/Settings');
  },
  get Share(): Share {
    return require('./Libraries/Share/Share');
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
    return require('./Libraries/ReactNative/RendererProxy')
      .unstable_batchedUpdates;
  },
  get useAnimatedValue(): useAnimatedValue {
    return require('./Libraries/Animated/useAnimatedValue').default;
  },
  get useColorScheme(): useColorScheme {
    return require('./Libraries/Utilities/useColorScheme').default;
  },
  get useWindowDimensions(): useWindowDimensions {
    return require('./Libraries/Utilities/useWindowDimensions').default;
  },
  get UTFSequence(): UTFSequence {
    return require('./Libraries/UTFSequence').default;
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
    return require('./Libraries/StyleSheet/processColor').default;
  },
  get requireNativeComponent(): <T: {...}>(
    uiViewClassName: string,
  ) => HostComponent<T> {
    return require('./Libraries/ReactNative/requireNativeComponent').default;
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
          "Please upgrade to use either 'react-native-svg' or a similar package. " +
          "If you cannot upgrade to a different library, please install the deprecated '@react-native-community/art' package. " +
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
          "It can now be installed and imported from '@react-native-camera-roll/camera-roll' instead of 'react-native'. " +
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
          "It can now be installed and imported from 'react-native-pager-view' instead of 'react-native'. " +
          'See https://github.com/callstack/react-native-pager-view',
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

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access SegmentedControlIOS. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access SegmentedControlIOS. */
  Object.defineProperty(module.exports, 'SegmentedControlIOS', {
    configurable: true,
    get() {
      invariant(
        false,
        'SegmentedControlIOS has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-segmented-control/segmented-control' instead of 'react-native'." +
          'See https://github.com/react-native-segmented-control/segmented-control',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access StatusBarIOS. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access StatusBarIOS. */
  Object.defineProperty(module.exports, 'StatusBarIOS', {
    configurable: true,
    get() {
      invariant(
        false,
        'StatusBarIOS has been removed from React Native. ' +
          'Has been merged with StatusBar. ' +
          'See https://reactnative.dev/docs/statusbar',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access PickerIOS. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access PickerIOS. */
  Object.defineProperty(module.exports, 'PickerIOS', {
    configurable: true,
    get() {
      invariant(
        false,
        'PickerIOS has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-picker/picker' instead of 'react-native'. " +
          'See https://github.com/react-native-picker/picker',
      );
    },
  });

  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access Picker. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access Picker. */
  Object.defineProperty(module.exports, 'Picker', {
    configurable: true,
    get() {
      invariant(
        false,
        'Picker has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-picker/picker' instead of 'react-native'. " +
          'See https://github.com/react-native-picker/picker',
      );
    },
  });
  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access DatePickerAndroid. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access DatePickerAndroid. */
  Object.defineProperty(module.exports, 'DatePickerAndroid', {
    configurable: true,
    get() {
      invariant(
        false,
        'DatePickerAndroid has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " +
          'See https://github.com/react-native-datetimepicker/datetimepicker',
      );
    },
  });
  /* $FlowFixMe[prop-missing] This is intentional: Flow will error when
   * attempting to access MaskedViewIOS. */
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access MaskedViewIOS. */
  Object.defineProperty(module.exports, 'MaskedViewIOS', {
    configurable: true,
    get() {
      invariant(
        false,
        'MaskedViewIOS has been removed from React Native. ' +
          "It can now be installed and imported from '@react-native-masked-view/masked-view' instead of 'react-native'. " +
          'See https://github.com/react-native-masked-view/masked-view',
      );
    },
  });
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
