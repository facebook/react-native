/**
 * Copyright (c) 2018-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/* global crypto */

var BatchedBridge = require('BatchedBridge');
var Recording = require('NativeModules').Recording;

var TestJSCryptoModule = {
  getRandomValues: function() {
    const data = new Uint8Array(8);
    const returnValue = crypto.getRandomValues(data);

    const returnsArray = data === returnValue;
    const populatesData = data.find(value => value !== 0) !== undefined;

    Recording.record(returnsArray && populatesData ? 'true' : 'false');
  },
};

BatchedBridge.registerCallableModule('TestJSCryptoModule', TestJSCryptoModule);

module.exports = TestJSCryptoModule;
