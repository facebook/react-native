/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule InitialPropsTestApp
 */

'use strict';

var React = require('React');
var RecordingModule = require('NativeModules').InitialPropsRecordingModule;
var Text = require('Text');

var InitialPropsTestApp = React.createClass({
  componentDidMount: function() {
    RecordingModule.recordProps(this.props);
  },
  render: function() {
    return <Text>dummy</Text>;
  }
});

module.exports = InitialPropsTestApp;
