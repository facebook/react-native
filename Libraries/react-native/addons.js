/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow
 */
'use strict';

var LinkedStateMixin = require('LinkedStateMixin');
var ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');
var ReactNative = require('react-native');
var ReactUpdates = require('ReactUpdates');

var cloneWithProps = require('cloneWithProps');
var update = require('update');

var addons = {
  LinkedStateMixin: LinkedStateMixin,
  PureRenderMixin: ReactComponentWithPureRenderMixin,
  batchedUpdates: ReactUpdates.batchedUpdates,
  cloneWithProps: cloneWithProps,
  update: update,
  Perf: undefined,
  TestUtils: undefined,
};

if (__DEV__) {
  addons.Perf = require('ReactDefaultPerf');
  addons.TestUtils = require('ReactTestUtils');
}

var ReactNativeWithAddons = {
  ...ReactNative,
  addons: addons,
};

module.exports = ReactNativeWithAddons;
