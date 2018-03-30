/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule InitialPropsTestApp
 */

'use strict';

var React = require('React');
var RecordingModule = require('NativeModules').InitialPropsRecordingModule;
var Text = require('Text');

class InitialPropsTestApp extends React.Component {
  componentDidMount() {
    RecordingModule.recordProps(this.props);
  }

  render() {
    return <Text>dummy</Text>;
  }
}

module.exports = InitialPropsTestApp;
