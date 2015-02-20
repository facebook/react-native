/**
 * Copyright 2004-present Facebook. All Rights Reserved.
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
   * @deprecated: Remove callsites and delete this method.
   *
   * @param {MessageQueue} messageQueue Message queue that has been created with
   * the `moduleConfig` (among others perhaps).
   * @param {object} moduleConfig Configuration of module names/method
   * names to callback types.
   * @return {object} Remote representation of configured module.
   */
  _createDeprecatedBridgedModule: function(messageQueue, moduleConfig, moduleName) {
    var remoteModule = mapObject(moduleConfig.methods, function(methodConfig, memberName) {
      return methodConfig.type === MethodTypes.local ? null : function() {
        var lastArg = arguments.length ? arguments[arguments.length - 1] : null;
        var hasCB =
          typeof lastArg == 'function';
        var args = slice.call(arguments, 0, arguments.length - (hasCB ? 1 : 0));
        var cb = hasCB ? lastArg : null;
        return messageQueue.callDeprecated(moduleName, memberName, args, cb);
      };
    });
    for (var constName in moduleConfig.constants) {
      warning(!remoteModule[constName], 'saw constant and method named %s', constName);
      remoteModule[constName] = moduleConfig.constants[constName];
    }
    return remoteModule;
  },

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
        var hasCBs = hasSuccCB;
        invariant(
          (hasSuccCB && hasErrorCB) || (!hasSuccCB && !hasErrorCB),
          'You must supply error callbacks and success callbacks or neither'
        );
        var args = slice.call(arguments, 0, arguments.length - (hasCBs ? 2 : 0));
        var onSucc = hasCBs ? lastArg : null;
        var onFail = hasCBs ? secondLastArg : null;
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
      // These deprecated modules do not accept an error callback.
      RemoteModulesDeprecated: mapObject(modulesConfig, this._createDeprecatedBridgedModule.bind(this, messageQueue)),
      RemoteModules: mapObject(modulesConfig, this._createBridgedModule.bind(this, messageQueue)),
      setLoggingEnabled: messageQueue.setLoggingEnabled.bind(messageQueue),
      getLoggedOutgoingItems: messageQueue.getLoggedOutgoingItems.bind(messageQueue),
      getLoggedIncomingItems: messageQueue.getLoggedIncomingItems.bind(messageQueue),
      replayPreviousLog: messageQueue.replayPreviousLog.bind(messageQueue)
    };
  }
};

module.exports = BatchedBridgeFactory;
