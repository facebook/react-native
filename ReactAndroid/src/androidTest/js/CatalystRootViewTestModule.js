/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CatalystRootViewTestModule
 */

'use strict';

var React = require('React');
var Recording = require('NativeModules').Recording;
var View = require('View');

var CatalystRootViewTestApp = React.createClass({
  componentWillUnmount: function() {
    Recording.record('RootComponentWillUnmount');
  },
  render: function() {
    return <View collapsable={false} style={{alignSelf: 'stretch'}} />;
  },
});

module.exports = {
  CatalystRootViewTestApp: CatalystRootViewTestApp,
};
