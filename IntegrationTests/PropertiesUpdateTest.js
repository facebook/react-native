/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @providesModule PropertiesUpdateTest
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  View,
} = ReactNative;

var { TestModule } = ReactNative.NativeModules;

class PropertiesUpdateTest extends React.Component {
  render() {
    if (this.props.markTestPassed) {
      TestModule.markTestPassed(true);
    }
    return (
      <View/>
    );
  }
}

PropertiesUpdateTest.displayName = 'PropertiesUpdateTest';

module.exports = PropertiesUpdateTest;
