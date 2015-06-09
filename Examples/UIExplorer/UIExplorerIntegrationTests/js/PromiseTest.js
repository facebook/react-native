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

  componentDidMount() {
    Promise.all([
      this.testShouldResolve(),
      this.testShouldReject(),
    ]).then(() => RCTTestModule.finish(
      this.shouldResolve && this.shouldReject
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

  render() {
      return <React.View />;
  }

});

module.exports = PromiseTest;
