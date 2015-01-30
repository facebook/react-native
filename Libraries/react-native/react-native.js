/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow
 */
'use strict';

var Bundler = require('Bundler');
var ExpandingText = require('ExpandingText');
var Image = require('Image');
var ListView = require('ListView');
var ListViewDataSource = require('ListViewDataSource');
var NavigatorIOS = require('NavigatorIOS');
var PixelRatio = require('PixelRatio');
var React = require('React');
var ScrollView = require('ScrollView');
var SpinnerIOS = require('SpinnerIOS');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var TextInput = require('TextInput');
var TimerMixin = require('TimerMixin');
var TouchableHighlight = require('TouchableHighlight');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');
var View = require('View');

var invariant = require('invariant');
var ix = require('ix');

var ReactNative = {
  ...React,
  Bundler,
  ExpandingText,
  Image,
  ListView,
  ListViewDataSource,
  NavigatorIOS,
  PixelRatio,
  ScrollView,
  SpinnerIOS,
  StyleSheet,
  Text,
  TextInput,
  TimerMixin,
  TouchableHighlight,
  TouchableWithoutFeedback,
  View,
  invariant,
  ix,
};

module.exports = ReactNative;
