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

const Systrace = require('Systrace');
const ErrorUtils = require('ErrorUtils');
const JSTimersExecution = require('JSTimersExecution');

const invariant = require('fbjs/lib/invariant');
const keyMirror = require('fbjs/lib/keyMirror');
const stringifySafe = require('stringifySafe');

const MODULE_IDS = 0;
const METHOD_IDS = 1;
const PARAMS = 2;
const MIN_TIME_BETWEEN_FLUSHES_MS = 5;

const TO_NATIVE = 1;
const TO_JS = 0;

const TRACE_TAG_REACT_APPS = 1 << 17;

const MethodTypes = keyMirror({
  remote: null,
  remoteAsync: null,
  syncHook: null,
});

const guard = (fn) => {
  try {
    fn();
  } catch (error) {
    ErrorUtils.reportFatalError(error);
  }
};

type Config = {
  remoteModuleConfig: Object,
};

class MessageQueue {
  constructor(configProvider: () => Config, serializeNativeParams: boolean) {
    this._callableModules = {};
    this._queue = [[], [], [], 0];
    this._callbacks = [];
    this._callbackID = 0;
    this._callID = 0;
    this._lastFlush = 0;
    this._eventLoopStartTime = new Date().getTime();
    this._serializeNativeParams = serializeNativeParams;

    if (__DEV__) {
      this._debugInfo = {};
      this._remoteModuleTable = {};
      this._remoteMethodTable = {};
    }

    [
      'invokeCallbackAndReturnFlushedQueue',
      'callFunctionReturnFlushedQueue',
      'callFunction',
      'flushedQueue',
    ].forEach((fn) => (this[fn] = this[fn].bind(this)));

    lazyProperty(this, 'RemoteModules', () => {
      const {remoteModuleConfig} = configProvider();
      const modulesConfig = this._genModulesConfig(remoteModuleConfig);
      const modules = this._genModules(modulesConfig);

      if (__DEV__) {
        this._genLookupTables(
          modulesConfig, this._remoteModuleTable, this._remoteMethodTable
        );
      }

      return modules;
    });
  }

  /**
   * Public APIs
   */

  static spy(spyOrToggle){
    if (spyOrToggle === true){
      MessageQueue.prototype.__spy = (info)=>{
        console.log(`${info.type == TO_JS ? 'N->JS' : 'JS->N'} : ` +
                    `${info.module ? (info.module+'.') : ''}${info.method}` +
                    `(${JSON.stringify(info.args)})`);
      }
    } else if (spyOrToggle === false) {
      MessageQueue.prototype.__spy = null;
    } else {
      MessageQueue.prototype.__spy = spyOrToggle;
    }
  }

  callFunctionReturnFlushedQueue(module, method, args) {
    guard(() => {
      this.__callFunction(module, method, args);
      this.__callImmediates();
    });

    return this.flushedQueue();
  }

  callFunction(module, method, args) {
    let result;
    guard(() => {
      result = this.__callFunction(module, method, args);
      this.__callImmediates();
    });

    return result;
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

    const queue = this._queue;
    this._queue = [[], [], [], this._callID];
    return queue[0].length ? queue : null;
  }

  processModuleConfig(config, moduleID) {
    const info = this._genModule(config, moduleID);
    this.RemoteModules[info.name] = info.module;
    if (__DEV__) {
      this._genLookup(config, moduleID, this._remoteModuleTable, this._remoteMethodTable);
    }
    return info.module;
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
      if (__DEV__) {
        // eventually delete old debug info
        (this._callbackID > (1 << 5)) &&
          (this._debugInfo[this._callbackID >> 5] = null);
        this._debugInfo[this._callbackID >> 1] = [module, method];
      }
      onFail && params.push(this._callbackID);
      this._callbacks[this._callbackID++] = onFail;
      onSucc && params.push(this._callbackID);
      this._callbacks[this._callbackID++] = onSucc;
    }
    var preparedParams = this._serializeNativeParams ? JSON.stringify(params) : params;

    if (__DEV__) {
      global.nativeTraceBeginAsyncFlow &&
        global.nativeTraceBeginAsyncFlow(TRACE_TAG_REACT_APPS, 'native', this._callID);
    }
    this._callID++;

    this._queue[MODULE_IDS].push(module);
    this._queue[METHOD_IDS].push(method);
    this._queue[PARAMS].push(preparedParams);

    const now = new Date().getTime();
    if (global.nativeFlushQueueImmediate &&
        now - this._lastFlush >= MIN_TIME_BETWEEN_FLUSHES_MS) {
      global.nativeFlushQueueImmediate(this._queue);
      this._queue = [[], [], [], this._callID];
      this._lastFlush = now;
    }
    Systrace.counterEvent('pending_js_to_native_queue', this._queue[0].length);
    if (__DEV__ && this.__spy && isFinite(module)) {
        this.__spy(
          { type: TO_NATIVE,
            module: this._remoteModuleTable[module],
            method: this._remoteMethodTable[module][method],
            args: params }
        );
    }
  }

  __callFunction(module: string, method: string, args: any) {
    this._lastFlush = new Date().getTime();
    this._eventLoopStartTime = this._lastFlush;
    Systrace.beginEvent(`${module}.${method}()`);
    if (__DEV__ && this.__spy) {
      this.__spy({ type: TO_JS, module, method, args});
    }
    const moduleMethods = this._callableModules[module];
    invariant(
      !!moduleMethods,
      'Module %s is not a registered callable module.',
      module
    );
    invariant(
      !!moduleMethods[method],
      'Method %s does not exist on module %s',
      method, module
    );
    const result = moduleMethods[method].apply(moduleMethods, args);
    Systrace.endEvent();
    return result;
  }

  __invokeCallback(cbID, args) {
    this._lastFlush = new Date().getTime();
    this._eventLoopStartTime = this._lastFlush;
    const callback = this._callbacks[cbID];

    if (__DEV__) {
      const debug = this._debugInfo[cbID >> 1];
      const module = debug && this._remoteModuleTable[debug[0]];
      const method = debug && this._remoteMethodTable[debug[0]][debug[1]];
      if (!callback) {
        let errorMessage = `Callback with id ${cbID}: ${module}.${method}() not found`;
        if (method) {
          errorMessage = `The callback ${method}() exists in module ${module}, `
          + 'but only one callback may be registered to a function in a native module.';
        }
        invariant(
          callback,
          errorMessage
        );
      }
      const profileName = debug ? '<callback for ' + module + '.' + method + '>' : cbID;
      if (callback && this.__spy && __DEV__) {
        this.__spy({ type: TO_JS, module:null, method:profileName, args });
      }
      Systrace.beginEvent(
        `MessageQueue.invokeCallback(${profileName}, ${stringifySafe(args)})`);
    } else {
      if (!callback) {
        return;
      }
    }

    this._callbacks[cbID & ~1] = null;
    this._callbacks[cbID |  1] = null;
    callback.apply(null, args);

    if (__DEV__) {
      Systrace.endEvent();
    }
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
      const moduleArray = [];
      const moduleNames = Object.keys(modules);
      for (var i = 0, l = moduleNames.length; i < l; i++) {
        const moduleName = moduleNames[i];
        const moduleConfig = modules[moduleName];
        const module = [moduleName];
        if (moduleConfig.constants) {
          module.push(moduleConfig.constants);
        }
        const methodsConfig = moduleConfig.methods;
        if (methodsConfig) {
          const methods = [];
          const asyncMethods = [];
          const syncHooks = [];
          const methodNames = Object.keys(methodsConfig);
          for (var j = 0, ll = methodNames.length; j < ll; j++) {
            const methodName = methodNames[j];
            const methodConfig = methodsConfig[methodName];
            methods[methodConfig.methodID] = methodName;
            if (methodConfig.type === MethodTypes.remoteAsync) {
              asyncMethods.push(methodConfig.methodID);
            } else if (methodConfig.type === MethodTypes.syncHook) {
              syncHooks.push(methodConfig.methodID);
            }
          }
          if (methods.length) {
            module.push(methods);
            module.push(asyncMethods);
            module.push(syncHooks);
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
    const modules = {};

    remoteModules.forEach((config, moduleID) => {
      const info = this._genModule(config, moduleID);
      if (info) {
        modules[info.name] = info.module;
      }
    });

    return modules;
  }

  _genModule(config, moduleID): ?Object {
    if (!config) {
      return null;
    }

    let moduleName, constants, methods, asyncMethods, syncHooks;
    if (moduleHasConstants(config)) {
      [moduleName, constants, methods, asyncMethods, syncHooks] = config;
    } else {
      [moduleName, methods, asyncMethods, syncHooks] = config;
    }

    const module = {};
    methods && methods.forEach((methodName, methodID) => {
      const isAsync = asyncMethods && arrayContains(asyncMethods, methodID);
      const isSyncHook = syncHooks && arrayContains(syncHooks, methodID);
      invariant(!isAsync || !isSyncHook, 'Cannot have a method that is both async and a sync hook');
      const methodType = isAsync ? MethodTypes.remoteAsync :
          isSyncHook ? MethodTypes.syncHook :
          MethodTypes.remote;
      module[methodName] = this._genMethod(moduleID, methodID, methodType);
    });
    Object.assign(module, constants);

    if (!constants && !methods && !asyncMethods) {
      module.moduleID = moduleID;
    }

    return { name: moduleName, module };
  }

  _genMethod(module, method, type) {
    let fn = null;
    const self = this;
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
    } else if (type === MethodTypes.syncHook) {
      return function(...args) {
        return global.nativeCallSyncHook(module, method, args);
      };
    } else {
      fn = function(...args) {
        const lastArg = args.length > 0 ? args[args.length - 1] : null;
        const secondLastArg = args.length > 1 ? args[args.length - 2] : null;
        const hasSuccCB = typeof lastArg === 'function';
        const hasErrorCB = typeof secondLastArg === 'function';
        hasErrorCB && invariant(
          hasSuccCB,
          'Cannot have a non-function arg after a function arg.'
        );
        const numCBs = hasSuccCB + hasErrorCB;
        const onSucc = hasSuccCB ? lastArg : null;
        const onFail = hasErrorCB ? secondLastArg : null;
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
  const {
    message,
    ...extraErrorInfo,
  } = errorData;
  const error = new Error(message);
  error.framesToPop = 1;
  return Object.assign(error, extraErrorInfo);
}

function lazyProperty(target: Object, name: string, f: () => any) {
  Object.defineProperty(target, name, {
    configurable: true,
    enumerable: true,
    get() {
      const value = f();
      Object.defineProperty(target, name, {
        configurable: true,
        enumerable: true,
        writeable: true,
        value: value,
      });
      return value;
    }
  });
}

module.exports = MessageQueue;
