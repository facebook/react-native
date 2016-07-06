/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @noflow - get/set properties not yet supported by flow. also `...require(x)` is broken #6560135
 */
'use strict';

const warning = require('fbjs/lib/warning');

if (__DEV__) {
  var warningDedupe = {};
  var addonWarn = function(prevName, newPackageName) {
    warning(
      warningDedupe[prevName],
      'React.addons.' + prevName + ' is deprecated. Please import the "' +
      newPackageName + '" package instead.'
    );
    warningDedupe[prevName] = true;
  };
}

// Export React, plus some native additions.
const ReactNative = {
  // Components
  get ActivityIndicator() { return require('ActivityIndicator'); },
  get ActivityIndicatorIOS() { return require('ActivityIndicatorIOS'); },
  get ART() { return require('ReactNativeART'); },
  get DatePickerIOS() { return require('DatePickerIOS'); },
  get DrawerLayoutAndroid() { return require('DrawerLayoutAndroid'); },
  get Image() { return require('Image'); },
  get ImageEditor() { return require('ImageEditor'); },
  get ImageStore() { return require('ImageStore'); },
  get KeyboardAvoidingView() { return require('KeyboardAvoidingView'); },
  get ListView() { return require('ListView'); },
  get MapView() { return require('MapView'); },
  get Modal() { return require('Modal'); },
  get Navigator() { return require('Navigator'); },
  get NavigatorIOS() { return require('NavigatorIOS'); },
  get Picker() { return require('Picker'); },
  get PickerIOS() { return require('PickerIOS'); },
  get ProgressBarAndroid() { return require('ProgressBarAndroid'); },
  get ProgressViewIOS() { return require('ProgressViewIOS'); },
  get ScrollView() { return require('ScrollView'); },
  get SegmentedControlIOS() { return require('SegmentedControlIOS'); },
  get Slider() { return require('Slider'); },
  get SliderIOS() { return require('SliderIOS'); },
  get SnapshotViewIOS() { return require('SnapshotViewIOS'); },
  get Switch() { return require('Switch'); },
  get RecyclerViewBackedScrollView() { return require('RecyclerViewBackedScrollView'); },
  get RefreshControl() { return require('RefreshControl'); },
  get StatusBar() { return require('StatusBar'); },
  get SwitchAndroid() { return require('SwitchAndroid'); },
  get SwitchIOS() { return require('SwitchIOS'); },
  get TabBarIOS() { return require('TabBarIOS'); },
  get Text() { return require('Text'); },
  get TextInput() { return require('TextInput'); },
  get ToastAndroid() { return require('ToastAndroid'); },
  get ToolbarAndroid() { return require('ToolbarAndroid'); },
  get Touchable() { return require('Touchable'); },
  get TouchableHighlight() { return require('TouchableHighlight'); },
  get TouchableNativeFeedback() { return require('TouchableNativeFeedback'); },
  get TouchableOpacity() { return require('TouchableOpacity'); },
  get TouchableWithoutFeedback() { return require('TouchableWithoutFeedback'); },
  get View() { return require('View'); },
  get ViewPagerAndroid() { return require('ViewPagerAndroid'); },
  get WebView() { return require('WebView'); },

  // APIs
  get ActionSheetIOS() { return require('ActionSheetIOS'); },
  get AdSupportIOS() { return require('AdSupportIOS'); },
  get Alert() { return require('Alert'); },
  get AlertIOS() { return require('AlertIOS'); },
  get Animated() { return require('Animated'); },
  get AppRegistry() { return require('AppRegistry'); },
  get AppState() { return require('AppState'); },
  get AppStateIOS() { return require('AppStateIOS'); },
  get AsyncStorage() { return require('AsyncStorage'); },
  get BackAndroid() { return require('BackAndroid'); },
  get CameraRoll() { return require('CameraRoll'); },
  get Clipboard() { return require('Clipboard'); },
  get DatePickerAndroid() { return require('DatePickerAndroid'); },
  get Dimensions() { return require('Dimensions'); },
  get Easing() { return require('Easing'); },
  get ImagePickerIOS() { return require('ImagePickerIOS'); },
  get IntentAndroid() { return require('IntentAndroid'); },
  get InteractionManager() { return require('InteractionManager'); },
  get Keyboard() { return require('Keyboard'); },
  get LayoutAnimation() { return require('LayoutAnimation'); },
  get Linking() { return require('Linking'); },
  get LinkingIOS() { return require('LinkingIOS'); },
  get NativeEventEmitter() { return require('NativeEventEmitter'); },
  get NavigationExperimental() { return require('NavigationExperimental'); },
  get NetInfo() { return require('NetInfo'); },
  get PanResponder() { return require('PanResponder'); },
  get PixelRatio() { return require('PixelRatio'); },
  get PushNotificationIOS() { return require('PushNotificationIOS'); },
  get Settings() { return require('Settings'); },
  get StatusBarIOS() { return require('StatusBarIOS'); },
  get StyleSheet() { return require('StyleSheet'); },
  get Systrace() { return require('Systrace'); },
  get TimePickerAndroid() { return require('TimePickerAndroid'); },
  get UIManager() { return require('UIManager'); },
  get Vibration() { return require('Vibration'); },
  get VibrationIOS() { return require('VibrationIOS'); },

  // Plugins
  get DeviceEventEmitter() { return require('RCTDeviceEventEmitter'); },
  get NativeAppEventEmitter() { return require('RCTNativeAppEventEmitter'); },
  get NativeModules() { return require('NativeModules'); },
  get Platform() { return require('Platform'); },
  get processColor() { return require('processColor'); },
  get requireNativeComponent() { return require('requireNativeComponent'); },

  // Prop Types
  get ColorPropType() { return require('ColorPropType'); },
  get EdgeInsetsPropType() { return require('EdgeInsetsPropType'); },
  get PointPropType() { return require('PointPropType'); },

  // See http://facebook.github.io/react/docs/addons.html
  addons: {
    get LinkedStateMixin() {
      if (__DEV__) {
        addonWarn('LinkedStateMixin', 'react-addons-linked-state-mixin');
      }
      return require('react/lib/LinkedStateMixin');
    },
    Perf: undefined,
    get PureRenderMixin() {
      if (__DEV__) {
        addonWarn('PureRenderMixin', 'react-addons-pure-render-mixin');
      }
      return require('react/lib/ReactComponentWithPureRenderMixin');
    },
    get TestModule() {
      if (__DEV__) {
        warning(
          warningDedupe.TestModule,
          'React.addons.TestModule is deprecated. ' +
          'Use ReactNative.NativeModules.TestModule instead.'
        );
        warningDedupe.TestModule = true;
      }
      return require('NativeModules').TestModule;
    },
    TestUtils: undefined,
    get batchedUpdates() {
      if (__DEV__) {
        warning(
          warningDedupe.batchedUpdates,
          'React.addons.batchedUpdates is deprecated. ' +
          'Use ReactNative.unstable_batchedUpdates instead.'
        );
        warningDedupe.batchedUpdates = true;
      }
      return require('react/lib/ReactUpdates').batchedUpdates;
    },
    get createFragment() {
      if (__DEV__) {
        addonWarn('createFragment', 'react-addons-create-fragment');
      }
      return require('react/lib/ReactFragment').create;
    },
    get update() {
      if (__DEV__) {
        addonWarn('update', 'react-addons-update');
      }
      return require('react/lib/update');
    },
  },
};

// Better error messages when accessing React APIs on ReactNative
if (__DEV__) {
  const throwOnWrongReactAPI = require('throwOnWrongReactAPI');
  const reactAPIs = [ 'createClass', 'Component' ];

  for (const key of reactAPIs) {
    Object.defineProperty(ReactNative, key, {
      get() { throwOnWrongReactAPI(key); },
      enumerable: false,
      configurable: false
    });
  }
}

// Preserve getters with warnings on the internal ReactNative copy without
// invoking them.
const ReactNativeInternal = require('react/lib/ReactNative');
function applyForwarding(key) {
  if (__DEV__) {
    Object.defineProperty(
      ReactNative,
      key,
      Object.getOwnPropertyDescriptor(ReactNativeInternal, key)
    );
    return;
  }
  ReactNative[key] = ReactNativeInternal[key];
}
for (const key in ReactNativeInternal) {
  applyForwarding(key);
}

if (__DEV__) {
  Object.defineProperty(ReactNative.addons, 'Perf', {
    enumerable: true,
    get: () => {
      if (__DEV__) {
        addonWarn('Perf', 'react-addons-perf');
      }
      return require('react/lib/ReactPerf');
    }
  });
  Object.defineProperty(ReactNative.addons, 'TestUtils', {
    enumerable: true,
    get: () => {
      if (__DEV__) {
        addonWarn('update', 'react-addons-test-utils');
      }
      return require('react/lib/ReactTestUtils');
    }
  });
}

module.exports = ReactNative;
