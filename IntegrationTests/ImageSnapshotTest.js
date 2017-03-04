/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ImageSnapshotTest
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Image,
  View,
} = ReactNative;
var { TestModule } = ReactNative.NativeModules;

class ImageSnapshotTest extends React.Component {
  componentDidMount() {
    if (!TestModule.verifySnapshot) {
      throw new Error('TestModule.verifySnapshot not defined.');
    }
  }

  done = (success : boolean) => {
    TestModule.markTestPassed(success);
  };

  render() {
    return (
      <Image
        source={require('./blue_square.png')}
        defaultSource={require('./red_square.png')}
        onLoad={() => TestModule.verifySnapshot(this.done)} />
    );
  }
}

ImageSnapshotTest.displayName = 'ImageSnapshotTest';

module.exports = ImageSnapshotTest;
