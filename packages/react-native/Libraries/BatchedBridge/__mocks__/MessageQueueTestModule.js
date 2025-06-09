/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * Dummy module that only exists for the sake of proving that the message queue
 * correctly dispatches to commonJS modules. The `testHook` is overridden by test
 * cases.
 */
const MessageQueueTestModule = {
  testHook1: function () {},
  testHook2: function () {},
};

// eslint-disable-next-line lint/no-commonjs-exports
module.exports = MessageQueueTestModule;
