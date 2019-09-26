/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {NativeModules, Text} = require('react-native');

class InitialPropsTestApp extends React.Component {
  componentDidMount() {
    NativeModules.InitialPropsRecordingModule.recordProps(this.props);
  }

  render() {
    return <Text>dummy</Text>;
  }
}

module.exports = InitialPropsTestApp;
