/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MessageQueue
 */

/*eslint no-bitwise: 0*/

'use strict';

let BridgeProfiling = require('BridgeProfiling');
let ErrorUtils = require('ErrorUtils');
let JSTimersExecution = require('JSTimersExecution');
let ReactUpdates = require('ReactUpdates');

let invariant = require('invariant');
let keyMirror = require('keyMirror');
let stringifySafe = require('stringifySafe');

let MODULE_IDS = 0;
let METHOD_IDS = 1;
let PARAMS = 2;
let MIN_TIME_BETWEEN_FLUSHES_MS = 5;

let SPY_MODE = false;

let MethodTypes = keyMirror({
  remote: null,
  remoteAsync: null,
});

var guard = (fn) => {
  try {
    fn();
  } catch (error) {
    ErrorUtils.reportFatalError(error);
  }
};

class MessageQueue {

  constructor(remoteModules, localModules, customRequire) {
    this.RemoteModules = {};

    this._require = customRequire || require;
    this._queue = [[],[],[]];
    this._moduleTable = {};
    this._methodTable = {};
    this._callbacks = [];
    this._callbackID = 0;
    this._lastFlush = 0;

    [
      'invokeCallbackAndReturnFlushedQueue',
      'callFunctionReturnFlushedQueue',
      'flushedQueue',
    ].forEach((fn) => this[fn] = this[fn].bind(this));

    let modulesConfig = this._genModulesConfig(remoteModules);
    this._genModules(modulesConfig);
    localModules && this._genLookupTables(
      this._genModulesConfig(localModules),this._moduleTable, this._methodTable
    );

    this._debugInfo = {};
    this._remoteModuleTable = {};
    this._remoteMethodTable = {};
    this._genLookupTables(
      modulesConfig, this._remoteModuleTable, this._remoteMethodTable
    );
  }

  /**
   * Public APIs
   */
  callFunctionReturnFlushedQueue(module, method, args) {
    guard(() => {
      this.__callFunction(module, method, args);
      this.__callImmediates();
    });

    return this.flushedQueue();
  }

  invokeCallbackAndReturnFlushedQueue(cbID, args) {
    guard(() => {
      this.__invokeCallback(cbID, args);
      this.__callImmediates();
    });

    return this.flushedQueue();
  }

  flushedQueue() {
    this.__callImmediates();

    let queue = this._queue;
    this._queue = [[],[],[]];
    return queue[0].length ? queue : null;
  }

  /**
   * "Private" methods
   */

  __callImmediates() {
    BridgeProfiling.profile('JSTimersExecution.callImmediates()');
    guard(() => JSTimersExecution.callImmediates());
    BridgeProfiling.profileEnd();
  }

  __nativeCall(module, method, params, onFail, onSucc) {
    if (onFail || onSucc) {
      // eventually delete old debug info
      (this._callbackID > (1 << 5)) &&
        (this._debugInfo[this._callbackID >> 5] = null);

      this._debugInfo[this._callbackID >> 1] = [module, method];
      onFail && params.push(this._callbackID);
      this._callbacks[this._callbackID++] = onFail;
      onSucc && params.push(this._callbackID);
      this._callbacks[this._callbackID++] = onSucc;
    }
    this._queue[MODULE_IDS].push(module);
    this._queue[METHOD_IDS].push(method);
    this._queue[PARAMS].push(params);

    var now = new Date().getTime();
    if (global.nativeFlushQueueImmediate &&
        now - this._lastFlush >= MIN_TIME_BETWEEN_FLUSHES_MS) {
      global.nativeFlushQueueImmediate(this._queue);
      this._queue = [[],[],[]];
      this._lastFlush = now;
    }
    if (__DEV__ && SPY_MODE && isFinite(module)) {
      console.log('JS->N : ' + this._remoteModuleTable[module] + '.' +
        this._remoteMethodTable[module][method] + '(' + JSON.stringify(params) + ')');
    }
  }

  __callFunction(module, method, args) {
    BridgeProfiling.profile(() => `${module}.${method}(${stringifySafe(args)})`);
    this._lastFlush = new Date().getTime();
    if (isFinite(module)) {
      method = this._methodTable[module][method];
      module = this._moduleTable[module];
    }
    if (__DEV__ && SPY_MODE) {
      console.log('N->JS : ' + module + '.' + method + '(' + JSON.stringify(args) + ')');
    }
    module = this._require(module);
    module[method].apply(module, args);
    BridgeProfiling.profileEnd();
  }

  __invokeCallback(cbID, args) {
    BridgeProfiling.profile(
      () => `MessageQueue.invokeCallback(${cbID}, ${stringifySafe(args)})`);
    this._lastFlush = new Date().getTime();
    let callback = this._callbacks[cbID];
    if (!callback || __DEV__) {
      let debug = this._debugInfo[cbID >> 1];
      let module = debug && this._remoteModuleTable[debug[0]];
      let method = debug && this._remoteMethodTable[debug[0]][debug[1]];
      invariant(
        callback,
        `Callback with id ${cbID}: ${module}.${method}() not found`
      );
      if (callback && SPY_MODE) {
        console.log('N->JS : <callback for ' + module + '.' + method + '>(' + JSON.stringify(args) + ')');
      }
    }
    this._callbacks[cbID & ~1] = null;
    this._callbacks[cbID |  1] = null;
    callback.apply(null, args);
    BridgeProfiling.profileEnd();
  }

  /**
   * Private helper methods
   */

  /**
   * Converts the old, object-based module structure to the new
   * array-based structure. TODO (t8823865) Removed this
   * function once Android has been updated.
   */
  _genModulesConfig(modules /* array or object */) {
    if (Array.isArray(modules)) {
      return modules;
    } else {
      let moduleArray = [];
      let moduleNames = Object.keys(modules);
      for (var i = 0, l = moduleNames.length; i < l; i++) {
        let moduleName = moduleNames[i];
        let moduleConfig = modules[moduleName];
        let module = [moduleName];
        if (moduleConfig.constants) {
          module.push(moduleConfig.constants);
        }
        let methodsConfig = moduleConfig.methods;
        if (methodsConfig) {
          let methods = [];
          let asyncMethods = [];
          let methodNames = Object.keys(methodsConfig);
          for (var j = 0, ll = methodNames.length; j < ll; j++) {
            let methodName = methodNames[j];
            let methodConfig = methodsConfig[methodName];
            methods[methodConfig.methodID] = methodName;
            if (methodConfig.type === MethodTypes.remoteAsync) {
              asyncMethods.push(methodConfig.methodID);
            }
          }
          if (methods.length) {
            module.push(methods);
            if (asyncMethods.length) {
              module.push(asyncMethods);
            }
          }
        }
        moduleArray[moduleConfig.moduleID] = module;
      }
      return moduleArray;
    }
  }

  _genLookupTables(modulesConfig, moduleTable, methodTable) {
    modulesConfig.forEach((module, moduleID) => {
      if (!module) {
        return;
      }

      let moduleName, methods;
      if (moduleHasConstants(module)) {
        [moduleName, , methods] = module;
      } else {
        [moduleName, methods] = module;
      }

      moduleTable[moduleID] = moduleName;
      methodTable[moduleID] = Object.assign({}, methods);
    });
  }

  _genModules(remoteModules) {
    remoteModules.forEach((module, moduleID) => {
      if (!module) {
        return;
      }

      let moduleName, constants, methods, asyncMethods;
      if (moduleHasConstants(module)) {
        [moduleName, constants, methods, asyncMethods] = module;
      } else {
        [moduleName, methods, asyncMethods] = module;
      }

      const moduleConfig = {moduleID, constants, methods, asyncMethods};
      this.RemoteModules[moduleName] = this._genModule({}, moduleConfig);
    });
  }

  _genModule(module, moduleConfig) {
    const {moduleID, constants, methods = [], asyncMethods = []} = moduleConfig;

    methods.forEach((methodName, methodID) => {
      const methodType =
        arrayContains(asyncMethods, methodID) ?
          MethodTypes.remoteAsync : MethodTypes.remote;
      module[methodName] = this._genMethod(moduleID, methodID, methodType);
    });
    Object.assign(module, constants);

    return module;
  }

  _genMethod(module, method, type) {
    let fn = null;
    let self = this;
    if (type === MethodTypes.remoteAsync) {
      fn = function(...args) {
        return new Promise((resolve, reject) => {
          self.__nativeCall(module, method, args, resolve, (errorData) => {
            var error = createErrorFromErrorData(errorData);
            reject(error);
          });
        });
      };
    } else {
      fn = function(...args) {
        let lastArg = args.length > 0 ? args[args.length - 1] : null;
        let secondLastArg = args.length > 1 ? args[args.length - 2] : null;
        let hasSuccCB = typeof lastArg === 'function';
        let hasErrorCB = typeof secondLastArg === 'function';
        hasErrorCB && invariant(
          hasSuccCB,
          'Cannot have a non-function arg after a function arg.'
        );
        let numCBs = hasSuccCB + hasErrorCB;
        let onSucc = hasSuccCB ? lastArg : null;
        let onFail = hasErrorCB ? secondLastArg : null;
        args = args.slice(0, args.length - numCBs);
        return self.__nativeCall(module, method, args, onFail, onSucc);
      };
    }
    fn.type = type;
    return fn;
  }

}

function moduleHasConstants(moduleArray: Array<Object|Array<>>): boolean {
  return !Array.isArray(moduleArray[1]);
}

function arrayContains<T>(array: Array<T>, value: T): boolean {
  return array.indexOf(value) !== -1;
}

function createErrorFromErrorData(errorData: {message: string}): Error {
  var {
    message,
    ...extraErrorInfo,
  } = errorData;
  var error = new Error(message);
  error.framesToPop = 1;
  return Object.assign(error, extraErrorInfo);
}

module.exports = MessageQueue;
