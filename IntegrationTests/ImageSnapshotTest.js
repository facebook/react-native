/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

class ImageSnapshotTest extends React.Component<{}> {
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
