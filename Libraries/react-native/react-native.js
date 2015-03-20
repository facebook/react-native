/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow
 */
'use strict';

var ReactNative = {
  ...require('React'),

  // Components
  ActivityIndicatorIOS: require('ActivityIndicatorIOS'),
  DatePickerIOS: require('DatePickerIOS'),
  Image: require('Image'),
  ListView: require('ListView'),
  MapView: require('MapView'),
  NavigatorIOS: require('NavigatorIOS'),
  PickerIOS: require('PickerIOS'),
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
  AppState: require('AppState'),
  AppStateIOS: require('AppStateIOS'),
  AsyncStorage: require('AsyncStorage'),
  CameraRoll: require('CameraRoll'),
  InteractionManager: require('InteractionManager'),
  LayoutAnimation: require('LayoutAnimation'),
  NetInfo: require('NetInfo'),
  PixelRatio: require('PixelRatio'),
  StatusBarIOS: require('StatusBarIOS'),
  StyleSheet: require('StyleSheet'),
  TimerMixin: require('TimerMixin'),
  VibrationIOS: require('VibrationIOS'),

  invariant: require('invariant'),
};

module.exports = ReactNative;
