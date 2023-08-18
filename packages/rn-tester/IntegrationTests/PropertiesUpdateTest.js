/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {View} = ReactNative;

const {TestModule} = ReactNative.NativeModules;

class PropertiesUpdateTest extends React.Component {
  render() {
    if (this.props.markTestPassed) {
      TestModule.markTestPassed(true);
    }
    return <View />;
  }
}

PropertiesUpdateTest.displayName = 'PropertiesUpdateTest';

module.exports = PropertiesUpdateTest;
