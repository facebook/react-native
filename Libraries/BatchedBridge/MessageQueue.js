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
const invariant = require('fbjs/lib/invariant');
const stringifySafe = require('stringifySafe');

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

class MessageQueue {
  _callableModules: {[key: string]: Object};
  _queue: [Array<number>, Array<number>, Array<any>, number];
  _callbacks: [];
  _callbackID: number;
  _callID: number;
  _inCall: number;
  _lastFlush: number;
  _eventLoopStartTime: number;

  _debugInfo: Object;
  _remoteModuleTable: Object;
  _remoteMethodTable: Object;

  __spy: ?(data: SpyData) => void;

  constructor() {
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
  }

  /**
   * Public APIs
   */

  static spy(spyOrToggle: boolean|(data: SpyData) => void){
    if (spyOrToggle === true){
      MessageQueue.prototype.__spy = info => {
        console.log(`${info.type === TO_JS ? 'N->JS' : 'JS->N'} : ` +
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
    this.__guard(() => {
      this.__callFunction(module, method, args);
      this.__callImmediates();
    });

    return this.flushedQueue();
  }

  callFunctionReturnResultAndFlushedQueue(module: string, method: string, args: Array<any>) {
    let result;
    this.__guard(() => {
      result = this.__callFunction(module, method, args);
      this.__callImmediates();
    });

    return [result, this.flushedQueue()];
  }

  invokeCallbackAndReturnFlushedQueue(cbID: number, args: Array<any>) {
    this.__guard(() => {
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

  getEventLoopRunningTime() {
    return new Date().getTime() - this._eventLoopStartTime;
  }

  registerCallableModule(name: string, module: Object) {
    this._callableModules[name] = module;
  }

  enqueueNativeCall(moduleID: number, methodID: number, params: Array<any>, onFail: ?Function, onSucc: ?Function) {
    if (onFail || onSucc) {
      if (__DEV__) {
        const callId = this._callbackID >> 1;
        this._debugInfo[callId] = [moduleID, methodID];
        if (callId > DEBUG_INFO_LIMIT) {
          delete this._debugInfo[callId - DEBUG_INFO_LIMIT];
        }
      }
      onFail && params.push(this._callbackID);
      /* $FlowFixMe(>=0.38.0 site=react_native_fb,react_native_oss) - Flow error
       * detected during the deployment of v0.38.0. To see the error, remove
       * this comment and run flow */
      this._callbacks[this._callbackID++] = onFail;
      onSucc && params.push(this._callbackID);
      /* $FlowFixMe(>=0.38.0 site=react_native_fb,react_native_oss) - Flow error
       * detected during the deployment of v0.38.0. To see the error, remove
       * this comment and run flow */
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
        (now - this._lastFlush >= MIN_TIME_BETWEEN_FLUSHES_MS ||
         this._inCall === 0)) {
      var queue = this._queue;
      this._queue = [[], [], [], this._callID];
      this._lastFlush = now;
      global.nativeFlushQueueImmediate(queue);
    }
    Systrace.counterEvent('pending_js_to_native_queue', this._queue[0].length);
    if (__DEV__ && this.__spy && isFinite(moduleID)) {
      this.__spy(
        { type: TO_NATIVE,
          module: this._remoteModuleTable[moduleID],
          method: this._remoteMethodTable[moduleID][methodID],
          args: params }
      );
    } else if (this.__spy) {
      this.__spy({type: TO_NATIVE, module: moduleID + '', method: methodID, args: params});
    }
  }

  createDebugLookup(moduleID: number, name: string, methods: Array<string>) {
    if (__DEV__) {
      this._remoteModuleTable[moduleID] = name;
      this._remoteMethodTable[moduleID] = methods;
    }
  }

  /**
   * Private methods
   */

  __guard(fn: () => void) {
    this._inCall++;
    try {
      fn();
    } catch (error) {
      ErrorUtils.reportFatalError(error);
    } finally {
      this._inCall--;
    }
  }

  __callImmediates() {
    Systrace.beginEvent('JSTimersExecution.callImmediates()');
    this.__guard(() => JSTimersExecution.callImmediates());
    Systrace.endEvent();
  }

  __callFunction(module: string, method: string, args: Array<any>) {
    this._lastFlush = new Date().getTime();
    this._eventLoopStartTime = this._lastFlush;
    Systrace.beginEvent(`${module}.${method}()`);
    if (this.__spy) {
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
      if (callback == null) {
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
      if (callback && this.__spy) {
        this.__spy({ type: TO_JS, module:null, method:profileName, args });
      }
      Systrace.beginEvent(
        `MessageQueue.invokeCallback(${profileName}, ${stringifySafe(args)})`);
    } else {
      if (!callback) {
        return;
      }
    }

    /* $FlowFixMe(>=0.38.0 site=react_native_fb,react_native_oss) - Flow error
     * detected during the deployment of v0.38.0. To see the error, remove this
     * comment and run flow */
    this._callbacks[cbID & ~1] = null;
    /* $FlowFixMe(>=0.38.0 site=react_native_fb,react_native_oss) - Flow error
     * detected during the deployment of v0.38.0. To see the error, remove this
     * comment and run flow */
    this._callbacks[cbID |  1] = null;
    // $FlowIssue(>=0.35.0) #14551610
    callback.apply(null, args);

    if (__DEV__) {
      Systrace.endEvent();
    }
  }
}

module.exports = MessageQueue;
