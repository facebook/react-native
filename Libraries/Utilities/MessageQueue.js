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

/*eslint no-bitwise: 0*/

'use strict';

const ErrorUtils = require('ErrorUtils');
const JSTimersExecution = require('JSTimersExecution');
const Systrace = require('Systrace');

const deepFreezeAndThrowOnMutationInDev = require('deepFreezeAndThrowOnMutationInDev');
const defineLazyObjectProperty = require('defineLazyObjectProperty');
const invariant = require('fbjs/lib/invariant');
const stringifySafe = require('stringifySafe');

export type ConfigProvider = () => {
  remoteModuleConfig: Array<ModuleConfig>,
};
export type MethodType = 'async' | 'promise' | 'sync';
export type ModuleConfig = [
  string, /* name */
  ?Object, /* constants */
  Array<string>, /* functions */
  Array<number>, /* promise method IDs */
  Array<number>, /* sync method IDs */
];
export type SpyData = {
  type: number,
  module: ?string,
  method: string|number,
  args: any
}

const TO_JS = 0;
const TO_NATIVE = 1;

const MODULE_IDS = 0;
const METHOD_IDS = 1;
const PARAMS = 2;
const MIN_TIME_BETWEEN_FLUSHES_MS = 5;

const TRACE_TAG_REACT_APPS = 1 << 17;

const DEBUG_INFO_LIMIT = 32;

const guard = (fn) => {
  try {
    fn();
  } catch (error) {
    ErrorUtils.reportFatalError(error);
  }
};

class MessageQueue {
  _callableModules: {[key: string]: Object};
  _queue: [Array<number>, Array<number>, Array<any>];
  _callbacks: [];
  _callbackID: number;
  _callID: number;
  _lastFlush: number;
  _eventLoopStartTime: number;

  RemoteModules: Object;

  _debugInfo: Object;
  _remoteModuleTable: Object;
  _remoteMethodTable: Object;

  __spy: ?(data: SpyData) => void;

  constructor(configProvider: ConfigProvider) {
    this._callableModules = {};
    this._queue = [[], [], [], 0];
    this._callbacks = [];
    this._callbackID = 0;
    this._callID = 0;
    this._lastFlush = 0;
    this._eventLoopStartTime = new Date().getTime();

    if (__DEV__) {
      this._debugInfo = {};
      this._remoteModuleTable = {};
      this._remoteMethodTable = {};
    }

    (this:any).callFunctionReturnFlushedQueue = this.callFunctionReturnFlushedQueue.bind(this);
    (this:any).callFunctionReturnResultAndFlushedQueue = this.callFunctionReturnResultAndFlushedQueue.bind(this);
    (this:any).flushedQueue = this.flushedQueue.bind(this);
    (this:any).invokeCallbackAndReturnFlushedQueue = this.invokeCallbackAndReturnFlushedQueue.bind(this);

    defineLazyObjectProperty(this, 'RemoteModules', {get: () => {
      const {remoteModuleConfig} = configProvider();
      return this._genModules(remoteModuleConfig);
    }});
  }

  /**
   * Public APIs
   */

  static spy(spyOrToggle: boolean|(data: SpyData) => void){
    if (spyOrToggle === true){
      MessageQueue.prototype.__spy = info => {
        console.log(`${info.type == TO_JS ? 'N->JS' : 'JS->N'} : ` +
                    `${info.module ? (info.module + '.') : ''}${info.method}` +
                    `(${JSON.stringify(info.args)})`);
      };
    } else if (spyOrToggle === false) {
      MessageQueue.prototype.__spy = null;
    } else {
      MessageQueue.prototype.__spy = spyOrToggle;
    }
  }

  callFunctionReturnFlushedQueue(module: string, method: string, args: Array<any>) {
    guard(() => {
      this.__callFunction(module, method, args);
      this.__callImmediates();
    });

    return this.flushedQueue();
  }

  callFunctionReturnResultAndFlushedQueue(module: string, method: string, args: Array<any>) {
    let result;
    guard(() => {
      result = this.__callFunction(module, method, args);
      this.__callImmediates();
    });

    return [result, this.flushedQueue()];
  }

  invokeCallbackAndReturnFlushedQueue(cbID: number, args: Array<any>) {
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

  processModuleConfig(config: ModuleConfig, moduleID: number) {
    const info = this._genModule(config, moduleID);
    if (!info) {
      return null;
    }

    this.RemoteModules[info.name] = info.module;
    if (__DEV__) {
      this._createDebugLookup(config, moduleID);
    }
    return info.module;
  }

  getEventLoopRunningTime() {
    return new Date().getTime() - this._eventLoopStartTime;
  }

  registerCallableModule(name: string, module: Object) {
    this._callableModules[name] = module;
  }

  /**
   * "Private" methods
   */
  __callImmediates() {
    Systrace.beginEvent('JSTimersExecution.callImmediates()');
    guard(() => JSTimersExecution.callImmediates());
    Systrace.endEvent();
  }

  __nativeCall(moduleID: number, methodID: number, params: Array<any>, onFail: ?Function, onSucc: ?Function) {
    if (onFail || onSucc) {
      if (__DEV__) {
        const callId = this._callbackID >> 1;
        this._debugInfo[callId] = [moduleID, methodID];
        if (callId > DEBUG_INFO_LIMIT) {
          delete this._debugInfo[callId - DEBUG_INFO_LIMIT];
        }
      }
      onFail && params.push(this._callbackID);
      this._callbacks[this._callbackID++] = onFail;
      onSucc && params.push(this._callbackID);
      this._callbacks[this._callbackID++] = onSucc;
    }

    if (__DEV__) {
      global.nativeTraceBeginAsyncFlow &&
        global.nativeTraceBeginAsyncFlow(TRACE_TAG_REACT_APPS, 'native', this._callID);
    }
    this._callID++;

    this._queue[MODULE_IDS].push(moduleID);
    this._queue[METHOD_IDS].push(methodID);

    if (__DEV__) {
      // Any params sent over the bridge should be encodable as JSON
      JSON.stringify(params);

      // The params object should not be mutated after being queued
      deepFreezeAndThrowOnMutationInDev((params:any));
    }
    this._queue[PARAMS].push(params);

    const now = new Date().getTime();
    if (global.nativeFlushQueueImmediate &&
        now - this._lastFlush >= MIN_TIME_BETWEEN_FLUSHES_MS) {
      global.nativeFlushQueueImmediate(this._queue);
      this._queue = [[], [], [], this._callID];
      this._lastFlush = now;
    }
    Systrace.counterEvent('pending_js_to_native_queue', this._queue[0].length);
    if (__DEV__ && this.__spy && isFinite(moduleID)) {
        this.__spy(
          { type: TO_NATIVE,
            module: this._remoteModuleTable[moduleID],
            method: this._remoteMethodTable[moduleID][methodID],
            args: params }
        );
    }
  }

  __callFunction(module: string, method: string, args: Array<any>) {
    this._lastFlush = new Date().getTime();
    this._eventLoopStartTime = this._lastFlush;
    Systrace.beginEvent(`${module}.${method}()`);
    if (__DEV__ && this.__spy) {
      this.__spy({ type: TO_JS, module, method, args});
    }
    const moduleMethods = this._callableModules[module];
    invariant(
      !!moduleMethods,
      'Module %s is not a registered callable module (calling %s)',
      module, method
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

  __invokeCallback(cbID: number, args: Array<any>) {
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

  _genModules(remoteModules) {
    const modules = {};
    remoteModules.forEach((config, moduleID) => {
      // Initially this config will only contain the module name when running in JSC. The actual
      // configuration of the module will be lazily loaded (see NativeModules.js) and updated
      // through processModuleConfig.
      const info = this._genModule(config, moduleID);
      if (info) {
        modules[info.name] = info.module;
      }

      if (__DEV__) {
        this._createDebugLookup(config, moduleID);
      }
    });
    return modules;
  }

  _genModule(config: ModuleConfig, moduleID: number): ?{name: string, module: Object} {
    if (!config) {
      return null;
    }

    const [moduleName, constants, methods, promiseMethods, syncMethods] = config;

    const module = {};
    methods && methods.forEach((methodName, methodID) => {
      const isPromise = promiseMethods && arrayContains(promiseMethods, methodID);
      const isSync = syncMethods && arrayContains(syncMethods, methodID);
      invariant(!isPromise || !isSync, 'Cannot have a method that is both async and a sync hook');
      const methodType = isPromise ? 'promise' : isSync ? 'sync' : 'async';
      module[methodName] = this._genMethod(moduleID, methodID, methodType);
    });
    Object.assign(module, constants);

    if (!constants && !methods) {
      // Module contents will be filled in lazily later (see NativeModules)
      module.moduleID = moduleID;
    }

    return { name: moduleName, module };
  }

  _genMethod(moduleID: number, methodID: number, type: MethodType) {
    let fn = null;
    const self = this;
    if (type === 'promise') {
      fn = function(...args: Array<any>) {
        return new Promise((resolve, reject) => {
          self.__nativeCall(moduleID, methodID, args,
            (data) => resolve(data),
            (errorData) => reject(createErrorFromErrorData(errorData)));
        });
      };
    } else if (type === 'sync') {
      fn = function(...args: Array<any>) {
        return global.nativeCallSyncHook(moduleID, methodID, args);
      };
    } else {
      fn = function(...args: Array<any>) {
        const lastArg = args.length > 0 ? args[args.length - 1] : null;
        const secondLastArg = args.length > 1 ? args[args.length - 2] : null;
        const hasSuccessCallback = typeof lastArg === 'function';
        const hasErrorCallback = typeof secondLastArg === 'function';
        hasErrorCallback && invariant(
          hasSuccessCallback,
          'Cannot have a non-function arg after a function arg.'
        );
        const onSuccess = hasSuccessCallback ? lastArg : null;
        const onFail = hasErrorCallback ? secondLastArg : null;
        const callbackCount = hasSuccessCallback + hasErrorCallback;
        args = args.slice(0, args.length - callbackCount);
        return self.__nativeCall(moduleID, methodID, args, onFail, onSuccess);
      };
    }
    fn.type = type;
    return fn;
  }

  _createDebugLookup(config: ModuleConfig, moduleID: number) {
    if (!config) {
      return;
    }

    const [moduleName, , methods] = config;
    this._remoteModuleTable[moduleID] = moduleName;
    this._remoteMethodTable[moduleID] = methods;
  }
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
  (error:any).framesToPop = 1;
  return Object.assign(error, extraErrorInfo);
}

module.exports = MessageQueue;
