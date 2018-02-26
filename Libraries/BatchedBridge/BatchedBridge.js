/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule BatchedBridge
 * @flow
 */
'use strict';

const MessageQueue = require('MessageQueue');

// MessageQueue can install a global handler to catch all exceptions where JS users can register their own behavior
// This handler makes all exceptions to be handled inside MessageQueue rather than by the VM at its origin
// This makes stacktraces to be placed at MessageQueue rather than at where they were launched
// The parameter __fbUninstallRNGlobalErrorHandler is passed to MessageQueue to prevent the handler from being installed
//
// __fbUninstallRNGlobalErrorHandler is conditionally set by the Inspector while the VM is paused for initialization
// If the Inspector isn't present it defaults to undefined and the global error handler is installed
// The Inspector can still call MessageQueue#uninstallGlobalErrorHandler to uninstalled on attach

const BatchedBridge = new MessageQueue(
  // $FlowFixMe
  typeof __fbUninstallRNGlobalErrorHandler !== 'undefined' &&
    __fbUninstallRNGlobalErrorHandler === true, // eslint-disable-line no-undef
);

// Wire up the batched bridge on the global object so that we can call into it.
// Ideally, this would be the inverse relationship. I.e. the native environment
// provides this global directly with its script embedded. Then this module
// would export it. A possible fix would be to trim the dependencies in
// MessageQueue to its minimal features and embed that in the native runtime.

Object.defineProperty(global, '__fbBatchedBridge', {
  configurable: true,
  value: BatchedBridge,
});

module.exports = BatchedBridge;
