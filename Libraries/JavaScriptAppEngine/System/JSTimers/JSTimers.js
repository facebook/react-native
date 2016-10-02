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
const RCTTiming = require('NativeModules').Timing;
const JSTimersExecution = require('JSTimersExecution');
const parseErrorStack = require('parseErrorStack');

// Returns a free index if one is available, and the next consecutive index otherwise.
function _getFreeIndex(): number {
  let freeIndex = JSTimersExecution.timerIDs.indexOf(null);
  if (freeIndex === -1) {
    freeIndex = JSTimersExecution.timerIDs.length;
  }
  return freeIndex;
}

function _allocateCallback(func: Function, type: $Keys<typeof JSTimersExecution.Type>): number {
  const id = JSTimersExecution.GUID++;
  const freeIndex = _getFreeIndex();
  JSTimersExecution.timerIDs[freeIndex] = id;
  JSTimersExecution.callbacks[freeIndex] = func;
  JSTimersExecution.types[freeIndex] = type;
  if (__DEV__) {
    const e = (new Error() : any);
    e.framesToPop = 1;
    const stack = parseErrorStack(e);
    if (stack) {
      /* $FlowFixMe(>=0.32.0) - this seems to be putting something of the wrong
       * type into identifiers */
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
    if (type !== JSTimersExecution.Type.setImmediate &&
        type !== JSTimersExecution.Type.requestIdleCallback) {
      RCTTiming.deleteTimer(timerID);
    }
  }
}

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
    const id = _allocateCallback(() => func.apply(undefined, args),
                                 JSTimersExecution.Type.setTimeout);
    RCTTiming.createTimer(id, duration || 0, Date.now(), /* recurring */ false);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every `duration` ms.
   * @param {number} duration Number of milliseconds.
   */
  setInterval: function(func: Function, duration: number, ...args?: any): number {
    const id = _allocateCallback(() => func.apply(undefined, args),
                                 JSTimersExecution.Type.setInterval);
    RCTTiming.createTimer(id, duration || 0, Date.now(), /* recurring */ true);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked before the end of the
   * current JavaScript execution loop.
   */
  setImmediate: function(func: Function, ...args?: any) {
    const id = _allocateCallback(() => func.apply(undefined, args),
                                 JSTimersExecution.Type.setImmediate);
    JSTimersExecution.immediates.push(id);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every frame.
   */
  requestAnimationFrame: function(func : Function) {
    const id = _allocateCallback(func, JSTimersExecution.Type.requestAnimationFrame);
    RCTTiming.createTimer(id, 1, Date.now(), /* recurring */ false);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every frame and provided
   * with time remaining in frame.
   */
  requestIdleCallback: function(func : Function) {
    if (JSTimersExecution.requestIdleCallbacks.length === 0) {
      RCTTiming.setSendIdleEvents(true);
    }

    const id = _allocateCallback(func, JSTimersExecution.Type.requestIdleCallback);
    JSTimersExecution.requestIdleCallbacks.push(id);
    return id;
  },

  cancelIdleCallback: function(timerID: number) {
    _freeCallback(timerID);
    const index = JSTimersExecution.requestIdleCallbacks.indexOf(timerID);
    if (index !== -1) {
      JSTimersExecution.requestIdleCallbacks.splice(index, 1);
    }

    if (JSTimersExecution.requestIdleCallbacks.length === 0) {
      RCTTiming.setSendIdleEvents(false);
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
