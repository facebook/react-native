/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MessageQueueTestModule
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
