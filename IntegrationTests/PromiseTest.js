/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @providesModule PromiseTest
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var { View } = ReactNative;
var { TestModule } = ReactNative.NativeModules;

class PromiseTest extends React.Component<{}> {
  shouldResolve = false;
  shouldReject = false;
  shouldSucceedAsync = false;
  shouldThrowAsync = false;

  componentDidMount() {
    Promise.all([
      this.testShouldResolve(),
      this.testShouldReject(),
      this.testShouldSucceedAsync(),
      this.testShouldThrowAsync(),
    ]).then(() => TestModule.markTestPassed(
      this.shouldResolve && this.shouldReject &&
      this.shouldSucceedAsync && this.shouldThrowAsync
    ));
  }

  testShouldResolve = () => {
    return TestModule
      .shouldResolve()
      .then(() => this.shouldResolve = true)
      .catch(() => this.shouldResolve = false);
  };

  testShouldReject = () => {
    return TestModule
      .shouldReject()
      .then(() => this.shouldReject = false)
      .catch(() => this.shouldReject = true);
  };

  testShouldSucceedAsync = async (): Promise<any> => {
    try {
      await TestModule.shouldResolve();
      this.shouldSucceedAsync = true;
    } catch (e) {
      this.shouldSucceedAsync = false;
    }
  };

  testShouldThrowAsync = async (): Promise<any> => {
    try {
      await TestModule.shouldReject();
      this.shouldThrowAsync = false;
    } catch (e) {
      this.shouldThrowAsync = true;
    }
  };

  render(): React.Node {
    return <View />;
  }
}

PromiseTest.displayName = 'PromiseTest';

module.exports = PromiseTest;
