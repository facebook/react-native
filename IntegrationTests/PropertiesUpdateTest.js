/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
