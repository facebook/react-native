/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

/**
 * Dummy module that only exists for the sake of proving that the message queue
 * correctly dispatches to commonJS modules. The `testHook` is overriden by test
 * cases.
 */
var MessageQueueTestModule = {
  testHook1: function() {
  },
  testHook2: function() {
  }
};

module.exports = MessageQueueTestModule;
