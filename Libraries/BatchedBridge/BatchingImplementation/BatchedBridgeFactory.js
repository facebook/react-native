/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BatchedBridgeFactory
 */
'use strict';

var invariant = require('invariant');
var keyMirror = require('keyMirror');
var mapObject = require('mapObject');
var warning = require('warning');

var slice = Array.prototype.slice;

var MethodTypes = keyMirror({
  remote: null,
  remoteAsync: null,
  local: null,
});

type ErrorData = {
  message: string;
  domain: string;
  code: number;
  nativeStackIOS?: string;
};

/**
 * Creates remotely invokable modules.
 */
var BatchedBridgeFactory = {
  MethodTypes: MethodTypes,
  /**
   * @param {MessageQueue} messageQueue Message queue that has been created with
   * the `moduleConfig` (among others perhaps).
   * @param {object} moduleConfig Configuration of module names/method
   * names to callback types.
   * @return {object} Remote representation of configured module.
   */
  _createBridgedModule: function(messageQueue, moduleConfig, moduleName) {
    var remoteModule = mapObject(moduleConfig.methods, function(methodConfig, memberName) {
      switch (methodConfig.type) {
        case MethodTypes.remote:
          return function() {
            var lastArg = arguments.length > 0 ? arguments[arguments.length - 1] : null;
            var secondLastArg = arguments.length > 1 ? arguments[arguments.length - 2] : null;
            var hasErrorCB = typeof lastArg === 'function';
            var hasSuccCB = typeof secondLastArg === 'function';
            hasSuccCB && invariant(
              hasErrorCB,
              'Cannot have a non-function arg after a function arg.'
            );
            var numCBs = (hasSuccCB ? 1 : 0) + (hasErrorCB ? 1 : 0);
            var args = slice.call(arguments, 0, arguments.length - numCBs);
            var onSucc = hasSuccCB ? secondLastArg : null;
            var onFail = hasErrorCB ? lastArg : null;
            messageQueue.call(moduleName, memberName, args, onSucc, onFail);
          };

        case MethodTypes.remoteAsync:
          return function(...args) {
            return new Promise((resolve, reject) => {
              messageQueue.call(moduleName, memberName, args, resolve, (errorData) => {
                var error = _createErrorFromErrorData(errorData);
                reject(error);
              });
            });
          };

        case MethodTypes.local:
          return null;

        default:
          throw new Error('Unknown bridge method type: ' + methodConfig.type);
      }
    });
    for (var constName in moduleConfig.constants) {
      warning(!remoteModule[constName], 'saw constant and method named %s', constName);
      remoteModule[constName] = moduleConfig.constants[constName];
    }
    return remoteModule;
  },

  create: function(MessageQueue, modulesConfig, localModulesConfig) {
    var messageQueue = new MessageQueue(modulesConfig, localModulesConfig);
    return {
      callFunction: messageQueue.callFunction.bind(messageQueue),
      callFunctionReturnFlushedQueue:
        messageQueue.callFunctionReturnFlushedQueue.bind(messageQueue),
      invokeCallback: messageQueue.invokeCallback.bind(messageQueue),
      invokeCallbackAndReturnFlushedQueue:
        messageQueue.invokeCallbackAndReturnFlushedQueue.bind(messageQueue),
      flushedQueue: messageQueue.flushedQueue.bind(messageQueue),
      RemoteModules: mapObject(modulesConfig, this._createBridgedModule.bind(this, messageQueue)),
      setLoggingEnabled: messageQueue.setLoggingEnabled.bind(messageQueue),
      getLoggedOutgoingItems: messageQueue.getLoggedOutgoingItems.bind(messageQueue),
      getLoggedIncomingItems: messageQueue.getLoggedIncomingItems.bind(messageQueue),
      replayPreviousLog: messageQueue.replayPreviousLog.bind(messageQueue),
      processBatch: messageQueue.processBatch.bind(messageQueue),
    };
  }
};

function _createErrorFromErrorData(errorData: ErrorData): Error {
  var {
    message,
    ...extraErrorInfo,
  } = errorData;
  var error = new Error(message);
  error.framesToPop = 1;
  return Object.assign(error, extraErrorInfo);
}

module.exports = BatchedBridgeFactory;
