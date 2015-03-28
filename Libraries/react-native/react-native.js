/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

// Export React, plus some native additions.
//
// The use of Object.create/assign is to work around a Flow bug (#6560135).
// Once that is fixed, change this back to
//
//   var ReactNative = {...require('React'), /* additions */}
//
var ReactNative = Object.assign(Object.create(require('React')), {
  // Components
  ActivityIndicatorIOS: require('ActivityIndicatorIOS'),
  DatePickerIOS: require('DatePickerIOS'),
  Image: require('Image'),
  ListView: require('ListView'),
  MapView: require('MapView'),
  NavigatorIOS: require('NavigatorIOS'),
  PickerIOS: require('PickerIOS'),
  Navigator: require('Navigator'),
  ScrollView: require('ScrollView'),
  SliderIOS: require('SliderIOS'),
  SwitchIOS: require('SwitchIOS'),
  TabBarIOS: require('TabBarIOS'),
  Text: require('Text'),
  TextInput: require('TextInput'),
  TouchableHighlight: require('TouchableHighlight'),
  TouchableOpacity: require('TouchableOpacity'),
  TouchableWithoutFeedback: require('TouchableWithoutFeedback'),
  View: require('View'),
  WebView: require('WebView'),

  // APIs
  AlertIOS: require('AlertIOS'),
  Animation: require('Animation'),
  AppRegistry: require('AppRegistry'),
  AppStateIOS: require('AppStateIOS'),
  AsyncStorage: require('AsyncStorage'),
  CameraRoll: require('CameraRoll'),
  InteractionManager: require('InteractionManager'),
  LinkingIOS: require('LinkingIOS'),
  LayoutAnimation: require('LayoutAnimation'),
  NetInfo: require('NetInfo'),
  PixelRatio: require('PixelRatio'),
  PushNotificationIOS: require('PushNotificationIOS'),
  PanResponder: require('PanResponder'),
  StatusBarIOS: require('StatusBarIOS'),
  StyleSheet: require('StyleSheet'),
  VibrationIOS: require('VibrationIOS'),

  // Plugins
  DeviceEventEmitter: require('RCTDeviceEventEmitter'),
  NativeModules: require('NativeModules'),

  addons: {
    LinkedStateMixin: require('LinkedStateMixin'),
    Perf: undefined,
    PureRenderMixin: require('ReactComponentWithPureRenderMixin'),
    TestModule: require('NativeModules').TestModule,
    TestUtils: undefined,
    batchedUpdates: require('ReactUpdates').batchedUpdates,
    cloneWithProps: require('cloneWithProps'),
    createFragment: require('ReactFragment').create,
    update: require('update'),
  },
});

if (__DEV__) {
  ReactNative.addons.Perf = require('ReactDefaultPerf');
  ReactNative.addons.TestUtils = require('ReactTestUtils');
}

module.exports = ReactNative;
