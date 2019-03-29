/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('React');
const RecordingModule = require('NativeModules').InitialPropsRecordingModule;
const Text = require('Text');

class InitialPropsTestApp extends React.Component {
  componentDidMount() {
    RecordingModule.recordProps(this.props);
  }

  render() {
    return <Text>dummy</Text>;
  }
}

module.exports = InitialPropsTestApp;
