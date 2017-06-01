/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PromiseTest
 */
'use strict';

var RCTTestModule = require('NativeModules').TestModule;
var React = require('react-native');

var PromiseTest = React.createClass({

  shouldResolve: false,
  shouldReject: false,
  shouldSucceedAsync: false,
  shouldThrowAsync: false,

  componentDidMount() {
    Promise.all([
      this.testShouldResolve(),
      this.testShouldReject(),
      this.testShouldSucceedAsync(),
      this.testShouldThrowAsync(),
    ]).then(() => RCTTestModule.markTestPassed(
      this.shouldResolve && this.shouldReject &&
      this.shouldSucceedAsync && this.shouldThrowAsync
    ));
  },

  testShouldResolve() {
    return RCTTestModule
      .shouldResolve()
      .then(() => this.shouldResolve = true)
      .catch(() => this.shouldResolve = false);
  },

  testShouldReject() {
    return RCTTestModule
      .shouldReject()
      .then(() => this.shouldReject = false)
      .catch(() => this.shouldReject = true);
  },

  async testShouldSucceedAsync() {
    try {
      await RCTTestModule.shouldResolve();
      this.shouldSucceedAsync = true;
    } catch (e) {
      this.shouldSucceedAsync = false;
    }
  },

  async testShouldThrowAsync() {
    try {
      await RCTTestModule.shouldReject();
      this.shouldThrowAsync = false;
    } catch (e) {
      this.shouldThrowAsync = true;
    }
  },

  render() {
    return <React.View />;
  }

});

PromiseTest.displayName = 'PromiseTest';

module.exports = PromiseTest;
