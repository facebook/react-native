/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const BatchedBridge = require('BatchedBridge');

const {assertEquals, assertTrue} = require('Asserts');
const {TestModule} = require('NativeModules');

var TestJavaToJSReturnValuesModule = {
  callMethod: function(methodName, expectedType, expectedJSON) {
    const result = TestModule[methodName]();
    assertEquals(expectedType, typeof result);
    assertEquals(expectedJSON, JSON.stringify(result));
  },

  triggerException: function() {
    try {
      TestModule.triggerException();
    } catch (ex) {
      assertTrue(ex.message.indexOf('Exception triggered') !== -1);
    }
  },
};

BatchedBridge.registerCallableModule(
  'TestJavaToJSReturnValuesModule',
  TestJavaToJSReturnValuesModule,
);

module.exports = TestJavaToJSReturnValuesModule;
