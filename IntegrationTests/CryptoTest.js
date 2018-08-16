/**
 * Copyright (c) 2018-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

declare var crypto: {getRandomValues: (data: Uint8Array) => Uint8Array};

const React = require('react');
const ReactNative = require('react-native');
const {View} = ReactNative;
const {TestModule} = ReactNative.NativeModules;

class CryptoTest extends React.Component<{}> {
  componentDidMount() {
    const data = new Uint8Array(8);
    const returnValue = crypto.getRandomValues(data);

    const returnsArray = data === returnValue;
    const populatesData = data.find(value => value !== 0) !== undefined;

    TestModule.markTestPassed(returnsArray && populatesData);
  }

  render(): React.Node {
    return <View />;
  }
}

CryptoTest.displayName = 'CryptoTest';

module.exports = CryptoTest;
