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

let Systrace = require('Systrace');
let ErrorUtils = require('ErrorUtils');
let JSTimersExecution = require('JSTimersExecution');
let Platform = require('Platform');

let invariant = require('fbjs/lib/invariant');
let keyMirror = require('fbjs/lib/keyMirror');
let stringifySafe = require('stringifySafe');

let MODULE_IDS = 0;
let METHOD_IDS = 1;
let PARAMS = 2;
let CALL_IDS = 3;
let MIN_TIME_BETWEEN_FLUSHES_MS = 5;

let TRACE_TAG_REACT_APPS = 1 << 17;

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

  constructor(remoteModules, localModules) {
    this.RemoteModules = {};

    this._callableModules = {};
    this._queue = [[], [], [], 0];
    this._moduleTable = {};
    this._methodTable = {};
    this._callbacks = [];
    this._callbackID = 0;
    this._callID = 0;
    this._lastFlush = 0;
    this._eventLoopStartTime = new Date().getTime();

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
    this._queue = [[], [], [], this._callID];
    return queue[0].length ? queue : null;
  }

  processModuleConfig(config, moduleID) {
    const module = this._genModule(config, moduleID);
    this._genLookup(config, moduleID, this._remoteModuleTable, this._remoteMethodTable);
    return module;
  }

  getEventLoopRunningTime() {
    return new Date().getTime() - this._eventLoopStartTime;
  }

  /**
   * "Private" methods
   */

  __callImmediates() {
    Systrace.beginEvent('JSTimersExecution.callImmediates()');
    guard(() => JSTimersExecution.callImmediates());
    Systrace.endEvent();
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

    global.nativeTraceBeginAsyncFlow &&
      global.nativeTraceBeginAsyncFlow(TRACE_TAG_REACT_APPS, 'native', this._callID);
    this._callID++;

    this._queue[MODULE_IDS].push(module);
    this._queue[METHOD_IDS].push(method);
    this._queue[PARAMS].push(params);

    var now = new Date().getTime();
    if (global.nativeFlushQueueImmediate &&
        now - this._lastFlush >= MIN_TIME_BETWEEN_FLUSHES_MS) {
      global.nativeFlushQueueImmediate(this._queue);
      this._queue = [[], [], [], this._callID];
      this._lastFlush = now;
    }
    Systrace.counterEvent('pending_js_to_native_queue', this._queue[0].length);
    if (__DEV__ && SPY_MODE && isFinite(module)) {
      console.log('JS->N : ' + this._remoteModuleTable[module] + '.' +
        this._remoteMethodTable[module][method] + '(' + JSON.stringify(params) + ')');
    }
  }

  __callFunction(module, method, args) {
    this._lastFlush = new Date().getTime();
    this._eventLoopStartTime = this._lastFlush;
    if (isFinite(module)) {
      method = this._methodTable[module][method];
      module = this._moduleTable[module];
    }
    Systrace.beginEvent(`${module}.${method}()`);
    if (__DEV__ && SPY_MODE) {
      console.log('N->JS : ' + module + '.' + method + '(' + JSON.stringify(args) + ')');
    }
    var moduleMethods = this._callableModules[module];
    invariant(
      !!moduleMethods,
      'Module %s is not a registered callable module.',
      module
    );
    moduleMethods[method].apply(moduleMethods, args);
    Systrace.endEvent();
  }

  __invokeCallback(cbID, args) {
    this._lastFlush = new Date().getTime();
    this._eventLoopStartTime = this._lastFlush;
    let callback = this._callbacks[cbID];
    let debug = this._debugInfo[cbID >> 1];
    let module = debug && this._remoteModuleTable[debug[0]];
    let method = debug && this._remoteMethodTable[debug[0]][debug[1]];
    if (!callback) {
      let errorMessage = `Callback with id ${cbID}: ${module}.${method}() not found`;
      if (method) {
        errorMessage = `The callback ${method}() exists in module ${module}, `
        + `but only one callback may be registered to a function in a native module.`;
      }
      invariant(
        callback,
        errorMessage
      );
    }
    let profileName = debug ? '<callback for ' + module + '.' + method + '>' : cbID;
    if (callback && SPY_MODE && __DEV__) {
      console.log('N->JS : ' + profileName + '(' + JSON.stringify(args) + ')');
    }
    Systrace.beginEvent(
      `MessageQueue.invokeCallback(${profileName}, ${stringifySafe(args)})`);
    this._callbacks[cbID & ~1] = null;
    this._callbacks[cbID |  1] = null;
    callback.apply(null, args);
    Systrace.endEvent();
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
    modulesConfig.forEach((config, moduleID) => {
      this._genLookup(config, moduleID, moduleTable, methodTable);
    });
  }

  _genLookup(config, moduleID, moduleTable, methodTable) {
    if (!config) {
      return;
    }

    let moduleName, methods;
    if (moduleHasConstants(config)) {
      [moduleName, , methods] = config;
    } else {
      [moduleName, methods] = config;
    }

    moduleTable[moduleID] = moduleName;
    methodTable[moduleID] = Object.assign({}, methods);
  }

  _genModules(remoteModules) {
    remoteModules.forEach((config, moduleID) => {
      this._genModule(config, moduleID);
    });
  }

  _genModule(config, moduleID) {
    if (!config) {
      return;
    }

    let moduleName, constants, methods, asyncMethods;
    if (moduleHasConstants(config)) {
      [moduleName, constants, methods, asyncMethods] = config;
    } else {
      [moduleName, methods, asyncMethods] = config;
    }

    let module = {};
    methods && methods.forEach((methodName, methodID) => {
      const methodType =
        asyncMethods && arrayContains(asyncMethods, methodID) ?
          MethodTypes.remoteAsync : MethodTypes.remote;
      module[methodName] = this._genMethod(moduleID, methodID, methodType);
    });
    Object.assign(module, constants);

    if (!constants && !methods && !asyncMethods) {
      module.moduleID = moduleID;
    }

    this.RemoteModules[moduleName] = module;
    return module;
  }

  _genMethod(module, method, type) {
    let fn = null;
    let self = this;
    if (type === MethodTypes.remoteAsync) {
      fn = function(...args) {
        return new Promise((resolve, reject) => {
          self.__nativeCall(
            module,
            method,
            args,
            (data) => {
              resolve(data);
            },
            (errorData) => {
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

  registerCallableModule(name, methods) {
    this._callableModules[name] = methods;
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
