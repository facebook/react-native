/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule CatalystRootViewTestModule
 */

'use strict';

var React = require('React');
var Recording = require('NativeModules').Recording;
var View = require('View');

class CatalystRootViewTestApp extends React.Component {
  componentWillUnmount() {
    Recording.record('RootComponentWillUnmount');
  }

  render() {
    return <View collapsable={false} style={{alignSelf: 'stretch'}} />;
  }
}

module.exports = {
  CatalystRootViewTestApp: CatalystRootViewTestApp,
};
