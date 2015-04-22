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
  local: null,
});

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
      return methodConfig.type === MethodTypes.local ? null : function() {
        var lastArg = arguments.length > 0 ? arguments[arguments.length - 1] : null;
        var secondLastArg = arguments.length > 1 ? arguments[arguments.length - 2] : null;
        var hasSuccCB = typeof lastArg === 'function';
        var hasErrorCB = typeof secondLastArg === 'function';
        hasErrorCB && invariant(
          hasSuccCB,
          'Cannot have a non-function arg after a function arg.'
        );
        var numCBs = (hasSuccCB ? 1 : 0) + (hasErrorCB ? 1 : 0);
        var args = slice.call(arguments, 0, arguments.length - numCBs);
        var onSucc = hasSuccCB ? lastArg : null;
        var onFail = hasErrorCB ? secondLastArg : null;
        return messageQueue.call(moduleName, memberName, args, onFail, onSucc);
      };
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

module.exports = BatchedBridgeFactory;
