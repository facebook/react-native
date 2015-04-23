/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MessageQueue
 * @flow
 */
'use strict';
var ErrorUtils = require('ErrorUtils');

var invariant = require('invariant');
var warning = require('warning');

var JSTimersExecution = require('JSTimersExecution');

var INTERNAL_ERROR = 'Error in MessageQueue implementation';

type ModulesConfig = {
  [key:string]: {
    moduleID: number;
    methods: {[key:string]: {
      methodID: number;
    }};
  }
}

type NameToID = {[key:string]: number}
type IDToName = {[key:number]: string}

/**
 * So as not to confuse static build system.
 */
var requireFunc = require;

/**
 * @param {Object!} module Module instance, must be loaded.
 * @param {string} methodName Name of method in `module`.
 * @param {array<*>} params Arguments to method.
 * @returns {*} Return value of method invocation.
 */
var jsCall = function(module, methodName, params) {
  return module[methodName].apply(module, params);
};

/**
 * A utility for aggregating "work" to be done, and potentially transferring
 * that work to another thread. Each instance of `MessageQueue` has the notion
 * of a "target" thread - the thread that the work will be sent to.
 *
 * TODO: Long running callback results, and streaming callback results (ability
 * for a callback to be invoked multiple times).
 *
 * @param {object} moduleNameToID Used to translate module/method names into
 * efficient numeric IDs.
 * @class MessageQueue
 */
var MessageQueue = function(
  remoteModulesConfig: ModulesConfig,
  localModulesConfig: ModulesConfig,
  customRequire: (id: string) => any
) {
  this._requireFunc = customRequire || requireFunc;
  this._initBookeeping();
  this._initNamingMap(remoteModulesConfig, localModulesConfig);
};

// REQUEST: Parallell arrays:
var REQUEST_MODULE_IDS = 0;
var REQUEST_METHOD_IDS = 1;
var REQUEST_PARAMSS = 2;
// RESPONSE: Parallell arrays:
var RESPONSE_CBIDS = 3;
var RESPONSE_RETURN_VALUES = 4;

/**
 * Utility to catch errors and prevent having to bind, or execute a bound
 * function, while catching errors in a process and returning a resulting
 * return value. This ensures that even if a process fails, we can still return
 * *some* values (from `_flushedQueueUnguarded` for example). Glorified
 * try/catch/finally that invokes the global `onerror`.
 *
 * @param {function} operation Function to execute, likely populates the
 * message buffer.
 * @param {Array<*>} operationArguments Arguments passed to `operation`.
 * @param {function} getReturnValue Returns a return value - will be invoked
 * even if the `operation` fails half way through completing its task.
 * @return {object} Return value returned from `getReturnValue`.
 */
var guardReturn = function(operation, operationArguments, getReturnValue, context) {
  if (operation) {
    ErrorUtils.applyWithGuard(operation, context, operationArguments);
  }
  if (getReturnValue) {
    return ErrorUtils.applyWithGuard(getReturnValue, context, null);
  }
  return null;
};

/**
  * Bookkeeping logic for callbackIDs. We ensure that success and error
  * callbacks are numerically adjacent.
  *
  * We could have also stored the association between success cbID and errorCBID
  * in a map without relying on this adjacency, but the bookkeeping here avoids
  * an additional two maps to associate in each direction, and avoids growing
  * dictionaries (new fields). Instead, we compute pairs of callback IDs, by
  * populating the `res` argument to `allocateCallbackIDs` (in conjunction with
  * pooling). Behind this bookeeping API, we ensure that error and success
  * callback IDs are always adjacent so that when one is invoked, we always know
  * how to free the memory of the other. By using this API, it is impossible to
  * create malformed callbackIDs that are not adjacent.
  */
var createBookkeeping = function() {
  return {
    /**
     * Incrementing callback ID. Must start at 1 - otherwise converted null
     * values which become zero are not distinguishable from a GUID of zero.
     */
    GUID: 1,
    errorCallbackIDForSuccessCallbackID: function(successID) {
      return successID + 1;
    },
    successCallbackIDForErrorCallbackID: function(errorID) {
      return errorID - 1;
    },
    allocateCallbackIDs: function(res) {
      res.successCallbackID = this.GUID++;
      res.errorCallbackID = this.GUID++;
    },
    isSuccessCallback: function(id) {
      return id % 2 === 1;
    }
  };
};

var MessageQueueMixin = {
  /**
   * Creates an efficient wire protocol for communicating across a bridge.
   * Avoids allocating strings.
   *
   * @param {object} remoteModulesConfig Configuration of modules and their
   * methods.
   */
  _initNamingMap: function(
    remoteModulesConfig: ModulesConfig,
    localModulesConfig: ModulesConfig
  ) {
    this._remoteModuleNameToModuleID = {};
    this._remoteModuleIDToModuleName = {};         // Reverse

    this._remoteModuleNameToMethodNameToID = {};
    this._remoteModuleNameToMethodIDToName = {};   // Reverse

    this._localModuleNameToModuleID = {};
    this._localModuleIDToModuleName = {};         // Reverse

    this._localModuleNameToMethodNameToID = {};
    this._localModuleNameToMethodIDToName = {};   // Reverse

    function fillMappings(
      modulesConfig: ModulesConfig,
      moduleNameToModuleID: NameToID,
      moduleIDToModuleName: IDToName,
      moduleNameToMethodNameToID: {[key:string]: NameToID},
      moduleNameToMethodIDToName: {[key:string]: IDToName}
    ) {
      for (var moduleName in modulesConfig) {
        var moduleConfig = modulesConfig[moduleName];
        var moduleID = moduleConfig.moduleID;
        moduleNameToModuleID[moduleName] = moduleID;
        moduleIDToModuleName[moduleID] = moduleName; // Reverse

        moduleNameToMethodNameToID[moduleName] = {};
        moduleNameToMethodIDToName[moduleName] = {}; // Reverse
        var methods = moduleConfig.methods;
        for (var methodName in methods) {
          var methodID = methods[methodName].methodID;
          moduleNameToMethodNameToID[moduleName][methodName] =
            methodID;
          moduleNameToMethodIDToName[moduleName][methodID] =
            methodName; // Reverse
        }
      }
    }
    fillMappings(
      remoteModulesConfig,
      this._remoteModuleNameToModuleID,
      this._remoteModuleIDToModuleName,
      this._remoteModuleNameToMethodNameToID,
      this._remoteModuleNameToMethodIDToName
    );

    fillMappings(
      localModulesConfig,
      this._localModuleNameToModuleID,
      this._localModuleIDToModuleName,
      this._localModuleNameToMethodNameToID,
      this._localModuleNameToMethodIDToName
    );

  },

  _initBookeeping: function() {
    this._POOLED_CBIDS = {errorCallbackID: null, successCallbackID: null};
    this._bookkeeping = createBookkeeping();

    /**
     * Stores callbacks so that we may simulate asynchronous return values from
     * other threads. Remote invocations in other threads can pass return values
     * back asynchronously to the requesting thread.
     */
    this._threadLocalCallbacksByID = [];
    this._threadLocalScopesByID = [];

    /**
     * Memory efficient parallel arrays. Each index cuts through the three
     * arrays and forms a remote invocation of methodName(params) whos return
     * value will be reported back to the other thread by way of the
     * corresponding id in cbIDs.  Each entry (A-D in the graphic below),
     * represents a work item of the following form:
     * - moduleID: ID of module to invoke method from.
     * - methodID: ID of method in module to invoke.
     * - params: List of params to pass to method.
     * - cbID: ID to respond back to originating thread with.
     *
     * TODO: We can make this even more efficient (memory) by creating a single
     * array, that is always pushed `n` elements as a time.
     */
    this._outgoingItems = [
      /*REQUEST_MODULE_IDS:     */ [/* +-+ +-+ +-+ +-+ */],
      /*REQUEST_METHOD_IDS:     */ [/* |A| |B| |C| |D| */],
      /*REQUEST_PARAMSS:        */ [/* |-| |-| |-| |-| */],

      /*RESPONSE_CBIDS:         */ [/* +-+ +-+ +-+ +-+ */],
                                    /* |E| |F| |G| |H| */
      /*RESPONSE_RETURN_VALUES: */ [/* +-+ +-+ +-+ +-+ */]
    ];

    /**
     * Used to allow returning the buffer, while at the same time clearing it in
     * a memory efficient manner.
     */
    this._outgoingItemsSwap = [[], [], [], [], []];
  },

  invokeCallback: function(cbID, args) {
    return guardReturn(this._invokeCallback, [cbID, args], null, this);
  },

  _invokeCallback: function(cbID, args) {
    try {
      var cb = this._threadLocalCallbacksByID[cbID];
      var scope = this._threadLocalScopesByID[cbID];
      warning(
        cb,
        'Cannot find callback with CBID %s. Native module may have invoked ' +
        'both the success callback and the error callback.',
         cbID
      );
      cb.apply(scope, args);
    } catch(ie_requires_catch) {
      throw ie_requires_catch;
    } finally {
      // Clear out the memory regardless of success or failure.
      this._freeResourcesForCallbackID(cbID);
    }
  },

  invokeCallbackAndReturnFlushedQueue: function(cbID, args) {
    if (this._enableLogging) {
      this._loggedIncomingItems.push([new Date().getTime(), cbID, args]);
    }
    return guardReturn(
      this._invokeCallback,
      [cbID, args],
      this._flushedQueueUnguarded,
      this
    );
  },

  callFunction: function(moduleID, methodID, params) {
    return guardReturn(this._callFunction, [moduleID, methodID, params], null, this);
  },

  _callFunction: function(moduleID, methodID, params) {
    var moduleName = this._localModuleIDToModuleName[moduleID];

    var methodName = this._localModuleNameToMethodIDToName[moduleName][methodID];
    var ret = jsCall(this._requireFunc(moduleName), methodName, params);

    return ret;
  },

  callFunctionReturnFlushedQueue: function(moduleID, methodID, params) {
    if (this._enableLogging) {
      this._loggedIncomingItems.push([new Date().getTime(), moduleID, methodID, params]);
    }
    return guardReturn(
      this._callFunction,
      [moduleID, methodID, params],
      this._flushedQueueUnguarded,
      this
    );
  },

  processBatch: function (batch) {
    var self = this;
    batch.forEach(function (call) {
      invariant(
        call.module === 'BatchedBridge',
        'All the calls should pass through the BatchedBridge module'
      );
      if (call.method === 'callFunctionReturnFlushedQueue') {
        self.callFunction.apply(self, call.args);
      } else if (call.method === 'invokeCallbackAndReturnFlushedQueue') {
        self.invokeCallback.apply(self, call.args);
      } else {
        throw new Error(
          'Unrecognized method called on BatchedBridge: ' + call.method);
      }
    });
    return this.flushedQueue();
  },

  setLoggingEnabled: function(enabled) {
    this._enableLogging = enabled;
    this._loggedIncomingItems = [];
    this._loggedOutgoingItems = [[], [], [], [], []];
  },

  getLoggedIncomingItems: function() {
    return this._loggedIncomingItems;
  },

  getLoggedOutgoingItems: function() {
    return this._loggedOutgoingItems;
  },

  replayPreviousLog: function(previousLog) {
    this._outgoingItems = previousLog;
  },

  /**
   * Simple helpers for clearing the queues. This doesn't handle the fact that
   * memory in the current buffer is leaked until the next frame or update - but
   * that will typically be on the order of < 500ms.
   */
  _swapAndReinitializeBuffer: function() {
    // Outgoing requests
    var currentOutgoingItems = this._outgoingItems;
    var nextOutgoingItems = this._outgoingItemsSwap;

    nextOutgoingItems[REQUEST_MODULE_IDS].length = 0;
    nextOutgoingItems[REQUEST_METHOD_IDS].length = 0;
    nextOutgoingItems[REQUEST_PARAMSS].length = 0;

    // Outgoing responses
    nextOutgoingItems[RESPONSE_CBIDS].length = 0;
    nextOutgoingItems[RESPONSE_RETURN_VALUES].length = 0;

    this._outgoingItemsSwap = currentOutgoingItems;
    this._outgoingItems = nextOutgoingItems;
  },

  /**
   * @param {string} moduleID JS module name.
   * @param {methodName} methodName Method in module to invoke.
   * @param {array<*>?} params Array representing arguments to method.
   * @param {string} cbID Unique ID to pass back in potential response.
   */
  _pushRequestToOutgoingItems: function(moduleID, methodName, params) {
    this._outgoingItems[REQUEST_MODULE_IDS].push(moduleID);
    this._outgoingItems[REQUEST_METHOD_IDS].push(methodName);
    this._outgoingItems[REQUEST_PARAMSS].push(params);

    if (this._enableLogging) {
      this._loggedOutgoingItems[REQUEST_MODULE_IDS].push(moduleID);
      this._loggedOutgoingItems[REQUEST_METHOD_IDS].push(methodName);
      this._loggedOutgoingItems[REQUEST_PARAMSS].push(params);
    }
  },

  /**
   * @param {string} cbID Unique ID that other side of bridge has remembered.
   * @param {*} returnValue Return value to pass to callback on other side of
   * bridge.
   */
  _pushResponseToOutgoingItems: function(cbID, returnValue) {
    this._outgoingItems[RESPONSE_CBIDS].push(cbID);
    this._outgoingItems[RESPONSE_RETURN_VALUES].push(returnValue);
  },

  _freeResourcesForCallbackID: function(cbID) {
    var correspondingCBID = this._bookkeeping.isSuccessCallback(cbID) ?
      this._bookkeeping.errorCallbackIDForSuccessCallbackID(cbID) :
      this._bookkeeping.successCallbackIDForErrorCallbackID(cbID);
    this._threadLocalCallbacksByID[cbID] = null;
    this._threadLocalScopesByID[cbID] = null;
    if (this._threadLocalCallbacksByID[correspondingCBID]) {
      this._threadLocalCallbacksByID[correspondingCBID] = null;
      this._threadLocalScopesByID[correspondingCBID] = null;
    }
  },

  /**
   * @param {Function} onFail Function to store in current thread for later
   * lookup, when request fails.
   * @param {Function} onSucc Function to store in current thread for later
   * lookup, when request succeeds.
   * @param {Object?=} scope Scope to invoke `cb` with.
   * @param {Object?=} res Resulting callback ids. Use `this._POOLED_CBIDS`.
   */
  _storeCallbacksInCurrentThread: function(onFail, onSucc, scope) {
    invariant(onFail || onSucc, INTERNAL_ERROR);
    this._bookkeeping.allocateCallbackIDs(this._POOLED_CBIDS);
    var succCBID = this._POOLED_CBIDS.successCallbackID;
    var errorCBID = this._POOLED_CBIDS.errorCallbackID;
    this._threadLocalCallbacksByID[errorCBID] = onFail;
    this._threadLocalCallbacksByID[succCBID] = onSucc;
    this._threadLocalScopesByID[errorCBID] = scope;
    this._threadLocalScopesByID[succCBID] = scope;
  },


  /**
   * IMPORTANT: There is possibly a timing issue with this form of flushing.  We
   * are currently not seeing any problems but the potential issue to look out
   * for is:
   * - While flushing this._outgoingItems contains the work for the other thread
   *   to perform.
   * - To mitigate this, we never allow enqueueing messages if the queue is
   *   already reserved - as long as it is reserved, it could be in the midst of
   *   a flush.
   *
   * If this ever occurs we can easily eliminate the race condition. We can
   * completely solve any ambiguity by sending messages such that we'll never
   * try to reserve the queue when already reserved. Here's the pseudocode:
   *
   *    var defensiveCopy = efficientDefensiveCopy(this._outgoingItems);
   *    this._swapAndReinitializeBuffer();
   */
  flushedQueue: function() {
    return guardReturn(null, null, this._flushedQueueUnguarded, this);
  },

  _flushedQueueUnguarded: function() {
    // Call the functions registred via setImmediate
    JSTimersExecution.callImmediates();

    var currentOutgoingItems = this._outgoingItems;
    this._swapAndReinitializeBuffer();
    var ret = currentOutgoingItems[REQUEST_MODULE_IDS].length ||
      currentOutgoingItems[RESPONSE_RETURN_VALUES].length ? currentOutgoingItems : null;

    return ret;
  },

  call: function(moduleName, methodName, params, onFail, onSucc, scope) {
    invariant(
      (!onFail || typeof onFail === 'function') &&
      (!onSucc || typeof onSucc === 'function'),
      'Callbacks must be functions'
    );
    // Store callback _before_ sending the request, just in case the MailBox
    // returns the response in a blocking manner.
    if (onSucc) {
      this._storeCallbacksInCurrentThread(onFail, onSucc, scope, this._POOLED_CBIDS);
      onFail && params.push(this._POOLED_CBIDS.errorCallbackID);
      params.push(this._POOLED_CBIDS.successCallbackID);
    }
    var moduleID = this._remoteModuleNameToModuleID[moduleName];
    if (moduleID === undefined || moduleID === null) {
      throw new Error('Unrecognized module name:' + moduleName);
    }
    var methodID = this._remoteModuleNameToMethodNameToID[moduleName][methodName];
    if (methodID === undefined || moduleID === null) {
      throw new Error('Unrecognized method name:' + methodName);
    }
    this._pushRequestToOutgoingItems(moduleID, methodID, params);
  },
  __numPendingCallbacksOnlyUseMeInTestCases: function() {
    var callbacks = this._threadLocalCallbacksByID;
    var total = 0;
    for (var i = 0; i < callbacks.length; i++) {
      if (callbacks[i]) {
        total++;
      }
    }
    return total;
  }
};

Object.assign(MessageQueue.prototype, MessageQueueMixin);
module.exports = MessageQueue;
