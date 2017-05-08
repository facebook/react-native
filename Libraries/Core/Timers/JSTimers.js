/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule JSTimers
 * @flow
 */
'use strict';

// Note that the module JSTimers is split into two in order to solve a cycle
// in dependencies. NativeModules > BatchedBridge > MessageQueue > JSTimersExecution
const JSTimersExecution = require('JSTimersExecution');
const Platform = require('Platform');

const {Timing} = require('NativeModules');
const performanceNow = require('fbjs/lib/performanceNow');

import type {JSTimerType} from 'JSTimersExecution';

// Returns a free index if one is available, and the next consecutive index otherwise.
function _getFreeIndex(): number {
  let freeIndex = JSTimersExecution.timerIDs.indexOf(null);
  if (freeIndex === -1) {
    freeIndex = JSTimersExecution.timerIDs.length;
  }
  return freeIndex;
}

function _allocateCallback(func: Function, type: JSTimerType): number {
  const id = JSTimersExecution.GUID++;
  const freeIndex = _getFreeIndex();
  JSTimersExecution.timerIDs[freeIndex] = id;
  JSTimersExecution.callbacks[freeIndex] = func;
  JSTimersExecution.types[freeIndex] = type;
  if (__DEV__) {
    const parseErrorStack = require('parseErrorStack');
    const e = (new Error() : any);
    e.framesToPop = 1;
    const stack = parseErrorStack(e);
    if (stack) {
      JSTimersExecution.identifiers[freeIndex] = stack.shift();
    }
  }
  return id;
}

function _freeCallback(timerID: number) {
  // JSTimersExecution.timerIDs contains nulls after timers have been removed;
  // ignore nulls upfront so indexOf doesn't find them
  if (timerID == null) {
    return;
  }

  const index = JSTimersExecution.timerIDs.indexOf(timerID);
  // See corresponding comment in `callTimers` for reasoning behind this
  if (index !== -1) {
    JSTimersExecution._clearIndex(index);
    const type = JSTimersExecution.types[index];
    if (type !== 'setImmediate' && type !== 'requestIdleCallback') {
      Timing.deleteTimer(timerID);
    }
  }
}

const MAX_TIMER_DURATION_MS = 60 * 1000;
const IS_ANDROID = Platform.OS === 'android';
const ANDROID_LONG_TIMER_MESSAGE =
  'Setting a timer for a long period of time, i.e. multiple minutes, is a ' +
  'performance and correctness issue on Android as it keeps the timer ' +
  'module awake, and timers can only be called when the app is in the foreground. ' +
  'See https://github.com/facebook/react-native/issues/12981 for more info.';

/**
 * JS implementation of timer functions. Must be completely driven by an
 * external clock signal, all that's stored here is timerID, timer type, and
 * callback.
 */
const JSTimers = {
  /**
   * @param {function} func Callback to be invoked after `duration` ms.
   * @param {number} duration Number of milliseconds.
   */
  setTimeout: function(func: Function, duration: number, ...args?: any): number {
    if (__DEV__ && IS_ANDROID && duration > MAX_TIMER_DURATION_MS) {
      console.warn(
          ANDROID_LONG_TIMER_MESSAGE + '\n' + '(Saw setTimeout with duration ' +
          duration + 'ms)');
    }
    const id = _allocateCallback(() => func.apply(undefined, args), 'setTimeout');
    Timing.createTimer(id, duration || 0, Date.now(), /* recurring */ false);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every `duration` ms.
   * @param {number} duration Number of milliseconds.
   */
  setInterval: function(func: Function, duration: number, ...args?: any): number {
    if (__DEV__ && IS_ANDROID && duration > MAX_TIMER_DURATION_MS) {
      console.warn(
          ANDROID_LONG_TIMER_MESSAGE + '\n' + '(Saw setInterval with duration ' +
          duration + 'ms)');
    }
    const id = _allocateCallback(() => func.apply(undefined, args), 'setInterval');
    Timing.createTimer(id, duration || 0, Date.now(), /* recurring */ true);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked before the end of the
   * current JavaScript execution loop.
   */
  setImmediate: function(func: Function, ...args?: any) {
    const id = _allocateCallback(() => func.apply(undefined, args), 'setImmediate');
    JSTimersExecution.immediates.push(id);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every frame.
   */
  requestAnimationFrame: function(func : Function) {
    const id = _allocateCallback(func, 'requestAnimationFrame');
    Timing.createTimer(id, 1, Date.now(), /* recurring */ false);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every frame and provided
   * with time remaining in frame.
   * @param {?object} options
   */
  requestIdleCallback: function(func : Function, options : ?Object) {
    if (JSTimersExecution.requestIdleCallbacks.length === 0) {
      Timing.setSendIdleEvents(true);
    }

    const timeout = options && options.timeout;
    const id = _allocateCallback(
      timeout != null ?
        deadline => {
          const timeoutId = JSTimersExecution.requestIdleCallbackTimeouts.get(id);
          if (timeoutId) {
            JSTimers.clearTimeout(timeoutId);
            JSTimersExecution.requestIdleCallbackTimeouts.delete(id);
          }
          return func(deadline);
        } :
        func,
      'requestIdleCallback'
    );
    JSTimersExecution.requestIdleCallbacks.push(id);

    if (timeout != null) {
      const timeoutId = JSTimers.setTimeout(() => {
        const index = JSTimersExecution.requestIdleCallbacks.indexOf(id);
        if (index > -1) {
          JSTimersExecution.requestIdleCallbacks.splice(index, 1);
          JSTimersExecution.callTimer(id, performanceNow(), true);
        }
        JSTimersExecution.requestIdleCallbackTimeouts.delete(id);
        if (JSTimersExecution.requestIdleCallbacks.length === 0) {
          Timing.setSendIdleEvents(false);
        }
      }, timeout);
      JSTimersExecution.requestIdleCallbackTimeouts.set(id, timeoutId);
    }
    return id;
  },

  cancelIdleCallback: function(timerID: number) {
    _freeCallback(timerID);
    const index = JSTimersExecution.requestIdleCallbacks.indexOf(timerID);
    if (index !== -1) {
      JSTimersExecution.requestIdleCallbacks.splice(index, 1);
    }

    const timeoutId = JSTimersExecution.requestIdleCallbackTimeouts.get(timerID);
    if (timeoutId) {
      JSTimers.clearTimeout(timeoutId);
      JSTimersExecution.requestIdleCallbackTimeouts.delete(timerID);
    }

    if (JSTimersExecution.requestIdleCallbacks.length === 0) {
      Timing.setSendIdleEvents(false);
    }
  },

  clearTimeout: function(timerID: number) {
    _freeCallback(timerID);
  },

  clearInterval: function(timerID: number) {
    _freeCallback(timerID);
  },

  clearImmediate: function(timerID: number) {
    _freeCallback(timerID);
    const index = JSTimersExecution.immediates.indexOf(timerID);
    if (index !== -1) {
      JSTimersExecution.immediates.splice(index, 1);
    }
  },

  cancelAnimationFrame: function(timerID: number) {
    _freeCallback(timerID);
  },
};

module.exports = JSTimers;
