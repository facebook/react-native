/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// Definitions by: Eloy Durán <https://github.com/alloy>
//                 HuHuanming <https://github.com/huhuanming>
//                 Kyle Roach <https://github.com/iRoachie>
//                 Tim Wang <https://github.com/timwangdev>
//                 Kamal Mahyuddin <https://github.com/kamal>
//                 Alex Dunne <https://github.com/alexdunne>
//                 Manuel Alabor <https://github.com/swissmanu>
//                 Michele Bombardi <https://github.com/bm-software>
//                 Martin van Dam <https://github.com/mvdam>
//                 Kacper Wiszczuk <https://github.com/esemesek>
//                 Ryan Nickel <https://github.com/mrnickel>
//                 Souvik Ghosh <https://github.com/souvik-ghosh>
//                 Cheng Gibson <https://github.com/nossbigg>
//                 Saransh Kataria <https://github.com/saranshkataria>
//                 Wojciech Tyczynski <https://github.com/tykus160>
//                 Jake Bloom <https://github.com/jakebloom>
//                 Ceyhun Ozugur <https://github.com/ceyhun>
//                 Mike Martin <https://github.com/mcmar>
//                 Theo Henry de Villeneuve <https://github.com/theohdv>
//                 Romain Faust <https://github.com/romain-faust>
//                 Be Birchall <https://github.com/bebebebebe>
//                 Jesse Katsumata <https://github.com/Naturalclar>
//                 Xianming Zhong <https://github.com/chinesedfan>
//                 Valentyn Tolochko <https://github.com/vtolochk>
//                 Sergey Sychev <https://github.com/SychevSP>
//                 Kelvin Chu <https://github.com/RageBill>
//                 Daiki Ihara <https://github.com/sasurau4>
//                 Abe Dolinger <https://github.com/256hz>
//                 Dominique Richard <https://github.com/doumart>
//                 Mohamed Shaban <https://github.com/drmas>
//                 Jérémy Barbet <https://github.com/jeremybarbet>
//                 David Sheldrick <https://github.com/ds300>
//                 Natsathorn Yuthakovit <https://github.com/natsathorn>
//                 ConnectDotz <https://github.com/connectdotz>
//                 Alexey Molchan <https://github.com/alexeymolchan>
//                 Alex Brazier <https://github.com/alexbrazier>
//                 Arafat Zahan <https://github.com/kuasha420>
//                 Pedro Hernández <https://github.com/phvillegas>
//                 Sebastian Silbermann <https://github.com/eps1lon>
//                 Zihan Chen <https://github.com/ZihanChen-MSFT>
//                 Lorenzo Sciandra <https://github.com/kelset>
//                 Mateusz Wit <https://github.com/MateWW>
//                 Saad Najmi <https://github.com/saadnajmi>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// Minimum TypeScript Version: 4.9

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// USING: these definitions are meant to be used with the TSC compiler target set to at least ES2015.
//
// USAGE EXAMPLES: check the RNTSExplorer project at https://github.com/bgrieder/RNTSExplorer
//
// CONTRIBUTING: please open pull requests
//
// CREDITS: This work is based on an original work made by Bernd Paradies: https://github.com/bparadie
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// <reference path="modules/BatchedBridge.d.ts" />
/// <reference path="modules/Codegen.d.ts" />
/// <reference path="modules/Devtools.d.ts" />
/// <reference path="../src/types/globals.d.ts" />

export * from '../Libraries/ActionSheetIOS/ActionSheetIOS';
export {default as ActionSheetIOS} from '../Libraries/ActionSheetIOS/ActionSheetIOS';
export * from '../Libraries/Alert/Alert';
export {default as Alert} from '../Libraries/Alert/Alert';
export * from '../Libraries/Animated/Animated';
export {default as Animated} from '../Libraries/Animated/Animated';
export * from '../Libraries/Animated/Easing';
export {default as Easing} from '../Libraries/Animated/Easing';
export * from '../Libraries/Animated/useAnimatedValue';
export {default as useAnimatedValue} from '../Libraries/Animated/useAnimatedValue';
export * from '../Libraries/Animated/useAnimatedValueXY';
export {default as useAnimatedValueXY} from '../Libraries/Animated/useAnimatedValueXY';
export * from '../Libraries/Animated/useAnimatedColor';
export {default as useAnimatedColor} from '../Libraries/Animated/useAnimatedColor';
export * from '../Libraries/Utilities/useColorScheme';
export {default as useColorScheme} from '../Libraries/Utilities/useColorScheme';
export * from '../Libraries/Utilities/useWindowDimensions';
export {default as useWindowDimensions} from '../Libraries/Utilities/useWindowDimensions';
export * from '../Libraries/AppState/AppState';
export {default as AppState} from '../Libraries/AppState/AppState';
export * from '../Libraries/BatchedBridge/NativeModules';
export {default as NativeModules} from '../Libraries/BatchedBridge/NativeModules';
export * from '../Libraries/Components/AccessibilityInfo/AccessibilityInfo';
export {default as AccessibilityInfo} from '../Libraries/Components/AccessibilityInfo/AccessibilityInfo';
export * from '../Libraries/Components/ActivityIndicator/ActivityIndicator';
export {default as ActivityIndicator} from '../Libraries/Components/ActivityIndicator/ActivityIndicator';
export * from '../Libraries/Components/Clipboard/Clipboard';
export {default as Clipboard} from '../Libraries/Components/Clipboard/Clipboard';
export * from '../Libraries/Components/DrawerAndroid/DrawerLayoutAndroid';
export {default as DrawerLayoutAndroid} from '../Libraries/Components/DrawerAndroid/DrawerLayoutAndroid';
export * from '../Libraries/Components/Keyboard/Keyboard';
export {default as Keyboard} from '../Libraries/Components/Keyboard/Keyboard';
export * from '../Libraries/Components/Keyboard/KeyboardAvoidingView';
export {default as KeyboardAvoidingView} from '../Libraries/Components/Keyboard/KeyboardAvoidingView';
export * from '../Libraries/Components/LayoutConformance/LayoutConformance';
export {default as experimental_LayoutConformance} from '../Libraries/Components/LayoutConformance/LayoutConformance';
export * from '../Libraries/Components/Pressable/Pressable';
export {default as Pressable} from '../Libraries/Components/Pressable/Pressable';
export * from '../Libraries/Components/ProgressBarAndroid/ProgressBarAndroid';
export {default as ProgressBarAndroid} from '../Libraries/Components/ProgressBarAndroid/ProgressBarAndroid';
export * from '../Libraries/Components/RefreshControl/RefreshControl';
export {default as RefreshControl} from '../Libraries/Components/RefreshControl/RefreshControl';
export * from '../Libraries/Components/SafeAreaView/SafeAreaView';
export {default as SafeAreaView} from '../Libraries/Components/SafeAreaView/SafeAreaView';
export * from '../Libraries/Components/ScrollView/ScrollView';
export {default as ScrollView} from '../Libraries/Components/ScrollView/ScrollView';
export * from '../Libraries/Components/StatusBar/StatusBar';
export {default as StatusBar} from '../Libraries/Components/StatusBar/StatusBar';
export * from '../Libraries/Components/Switch/Switch';
export {default as Switch} from '../Libraries/Components/Switch/Switch';
export * from '../Libraries/Components/TextInput/InputAccessoryView';
export {default as InputAccessoryView} from '../Libraries/Components/TextInput/InputAccessoryView';
export * from '../Libraries/Components/TextInput/TextInput';
export {default as TextInput} from '../Libraries/Components/TextInput/TextInput';
export * from '../Libraries/Components/ToastAndroid/ToastAndroid';
export {default as ToastAndroid} from '../Libraries/Components/ToastAndroid/ToastAndroid';
export * from '../Libraries/Components/Touchable/Touchable';
export {default as Touchable} from '../Libraries/Components/Touchable/Touchable';
export * from '../Libraries/Components/Touchable/TouchableHighlight';
export {default as TouchableHighlight} from '../Libraries/Components/Touchable/TouchableHighlight';
export * from '../Libraries/Components/Touchable/TouchableNativeFeedback';
export {default as TouchableNativeFeedback} from '../Libraries/Components/Touchable/TouchableNativeFeedback';
export * from '../Libraries/Components/Touchable/TouchableOpacity';
export {default as TouchableOpacity} from '../Libraries/Components/Touchable/TouchableOpacity';
export * from '../Libraries/Components/Touchable/TouchableWithoutFeedback';
export {default as TouchableWithoutFeedback} from '../Libraries/Components/Touchable/TouchableWithoutFeedback';
export * from '../Libraries/Components/View/View';
export {default as View} from '../Libraries/Components/View/View';
export * from '../Libraries/Components/View/ViewAccessibility';
export * from '../Libraries/Components/View/ViewPropTypes';
export * from '../Libraries/Components/Button';
export {default as Button} from '../Libraries/Components/Button';
export * from '../Libraries/Core/registerCallableModule';
export {default as ReactNativeVersion} from '../Libraries/Core/ReactNativeVersion';
export {default as registerCallableModule} from '../Libraries/Core/registerCallableModule';
export * as NativeComponentRegistry from '../Libraries/NativeComponent/NativeComponentRegistry';
export * from '../Libraries/EventEmitter/NativeEventEmitter';
export {default as NativeEventEmitter} from '../Libraries/EventEmitter/NativeEventEmitter';
export * from '../Libraries/EventEmitter/RCTDeviceEventEmitter';
export {default as DeviceEventEmitter} from '../Libraries/EventEmitter/RCTDeviceEventEmitter';
export * from '../Libraries/EventEmitter/RCTNativeAppEventEmitter';
export {default as NativeAppEventEmitter} from '../Libraries/EventEmitter/RCTNativeAppEventEmitter';
export * from '../Libraries/Image/Image';
export {default as Image} from '../Libraries/Image/Image';
export * from '../Libraries/Image/ImageBackground';
export {default as ImageBackground} from '../Libraries/Image/ImageBackground';
export * from '../Libraries/Image/ImageResizeMode';
export * from '../Libraries/Image/ImageSource';
export * from '../Libraries/Interaction/InteractionManager';
export {default as InteractionManager} from '../Libraries/Interaction/InteractionManager';
export * from '../Libraries/Interaction/PanResponder';
export {default as PanResponder} from '../Libraries/Interaction/PanResponder';
export * from '../Libraries/LayoutAnimation/LayoutAnimation';
export {default as LayoutAnimation} from '../Libraries/LayoutAnimation/LayoutAnimation';
export * from '../Libraries/Linking/Linking';
export {default as Linking} from '../Libraries/Linking/Linking';
export * from '../Libraries/Lists/FlatList';
export {default as FlatList} from '../Libraries/Lists/FlatList';
export * from '../Libraries/Lists/SectionList';
export {default as SectionList} from '../Libraries/Lists/SectionList';
export * from '@react-native/virtualized-lists';
export * from '../Libraries/LogBox/LogBox';
export {default as LogBox} from '../Libraries/LogBox/LogBox';
export * from '../Libraries/Modal/Modal';
export {default as Modal} from '../Libraries/Modal/Modal';
export * as Systrace from '../Libraries/Performance/Systrace';
export * from '../Libraries/PermissionsAndroid/PermissionsAndroid';
export {default as PermissionsAndroid} from '../Libraries/PermissionsAndroid/PermissionsAndroid';
export * from '../Libraries/PushNotificationIOS/PushNotificationIOS';
export {default as PushNotificationIOS} from '../Libraries/PushNotificationIOS/PushNotificationIOS';
export * from '../Libraries/ReactNative/AppRegistry';
export * from '../Libraries/ReactNative/I18nManager';
export {default as I18nManager} from '../Libraries/ReactNative/I18nManager';
export * from '../Libraries/ReactNative/RendererProxy';
export {RootTagContext} from '../Libraries/ReactNative/RootTag';
export * from '../Libraries/ReactNative/UIManager';
export {default as UIManager} from '../Libraries/ReactNative/UIManager';
export * from '../Libraries/ReactNative/requireNativeComponent';
export {default as requireNativeComponent} from '../Libraries/ReactNative/requireNativeComponent';
export * from '../Libraries/Settings/Settings';
export {default as Settings} from '../Libraries/Settings/Settings';
export * from '../Libraries/Share/Share';
export {default as Share} from '../Libraries/Share/Share';
export {DynamicColorIOS} from '../Libraries/StyleSheet/PlatformColorValueTypesIOS';
export {PlatformColor} from '../Libraries/StyleSheet/PlatformColorValueTypes';
export * from '../Libraries/StyleSheet/StyleSheet';
export {default as StyleSheet} from '../Libraries/StyleSheet/StyleSheet';
export * from '../Libraries/StyleSheet/StyleSheetTypes';
export * from '../Libraries/StyleSheet/processColor';
export {default as processColor} from '../Libraries/StyleSheet/processColor';
export * from '../Libraries/Text/Text';
export {default as Text} from '../Libraries/Text/Text';
export {default as unstable_TextAncestorContext} from '../Libraries/Text/TextAncestorContext';
export * from '../Libraries/TurboModule/RCTExport';
export * as TurboModuleRegistry from '../Libraries/TurboModule/TurboModuleRegistry';
export * as CodegenTypes from '../Libraries/Types/CodegenTypesNamespace';
export * from '../Libraries/Types/CoreEventTypes';
export * as Appearance from '../Libraries/Utilities/Appearance';
export * from '../Libraries/Utilities/BackHandler';
export {default as BackHandler} from '../Libraries/Utilities/BackHandler';
export * from '../src/private/devsupport/devmenu/DevMenu';
export {default as DevMenu} from '../src/private/devsupport/devmenu/DevMenu';
export * from '../Libraries/Utilities/DevSettings';
export {default as DevSettings} from '../Libraries/Utilities/DevSettings';
export * from '../Libraries/Utilities/Dimensions';
export {default as Dimensions} from '../Libraries/Utilities/Dimensions';
export * from '../Libraries/Utilities/PixelRatio';
export {default as PixelRatio} from '../Libraries/Utilities/PixelRatio';
export * from '../Libraries/Utilities/Platform';
export {default as Platform} from '../Libraries/Utilities/Platform';
export * from '../Libraries/Vibration/Vibration';
export {default as Vibration} from '../Libraries/Vibration/Vibration';
export {default as UTFSequence} from '../Libraries/UTFSequence';
export * from '../Libraries/vendor/core/ErrorUtils';
export {
  default as EventEmitter,
  EmitterSubscription,
  EventSubscription,
} from '../Libraries/vendor/emitter/EventEmitter';

export * from './public/DeprecatedPropertiesAlias';
export * from './public/Insets';
export * from './public/ReactNativeRenderer';
export * from './public/ReactNativeTypes';

export {default as codegenNativeCommands} from '../Libraries/Utilities/codegenNativeCommands';
export {default as codegenNativeComponent} from '../Libraries/Utilities/codegenNativeComponent';
