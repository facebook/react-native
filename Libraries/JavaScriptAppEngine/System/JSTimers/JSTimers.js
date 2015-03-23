/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule JSTimers
 */
'use strict';

// Note that the module JSTimers is split into two in order to solve a cycle
// in dependencies. NativeModules > BatchedBridge > MessageQueue > JSTimersExecution
var RCTTiming = require('NativeModules').Timing;
var JSTimersExecution = require('JSTimersExecution');

/**
 * JS implementation of timer functions. Must be completely driven by an
 * external clock signal, all that's stored here is timerID, timer type, and
 * callback.
 */
var JSTimers = {
  Types: JSTimersExecution.Types,

  /**
   * Returns a free index if one is available, and the next consecutive index
   * otherwise.
   */
  _getFreeIndex: function() {
    var freeIndex = JSTimersExecution.timerIDs.indexOf(null);
    if (freeIndex === -1) {
      freeIndex = JSTimersExecution.timerIDs.length;
    }
    return freeIndex;
  },

  /**
   * @param {function} func Callback to be invoked after `duration` ms.
   * @param {number} duration Number of milliseconds.
   */
  setTimeout: function(func, duration, ...args) {
    var newID = JSTimersExecution.GUID++;
    var freeIndex = JSTimers._getFreeIndex();
    JSTimersExecution.timerIDs[freeIndex] = newID;
    JSTimersExecution.callbacks[freeIndex] = func;
    JSTimersExecution.callbacks[freeIndex] = function() {
      return func.apply(undefined, args);
    };
    JSTimersExecution.types[freeIndex] = JSTimersExecution.Type.setTimeout;
    RCTTiming.createTimer(newID, duration, Date.now(), /** recurring */ false);
    return newID;
  },

  /**
   * @param {function} func Callback to be invoked every `duration` ms.
   * @param {number} duration Number of milliseconds.
   */
  setInterval: function(func, duration, ...args) {
    var newID = JSTimersExecution.GUID++;
    var freeIndex = JSTimers._getFreeIndex();
    JSTimersExecution.timerIDs[freeIndex] = newID;
    JSTimersExecution.callbacks[freeIndex] = func;
    JSTimersExecution.callbacks[freeIndex] = function() {
      return func.apply(undefined, args);
    };
    JSTimersExecution.types[freeIndex] = JSTimersExecution.Type.setInterval;
    RCTTiming.createTimer(newID, duration, Date.now(), /** recurring */ true);
    return newID;
  },

  /**
   * @param {function} func Callback to be invoked before the end of the
   * current JavaScript execution loop.
   */
  setImmediate: function(func, ...args) {
    var newID = JSTimersExecution.GUID++;
    var freeIndex = JSTimers._getFreeIndex();
    JSTimersExecution.timerIDs[freeIndex] = newID;
    JSTimersExecution.callbacks[freeIndex] = func;
    JSTimersExecution.callbacks[freeIndex] = function() {
      return func.apply(undefined, args);
    };
    JSTimersExecution.types[freeIndex] = JSTimersExecution.Type.setImmediate;
    JSTimersExecution.immediates.push(newID);
    return newID;
  },

  /**
   * @param {function} func Callback to be invoked every frame.
   */
  requestAnimationFrame: function(func) {
    var newID = JSTimersExecution.GUID++;
    var freeIndex = JSTimers._getFreeIndex();
    JSTimersExecution.timerIDs[freeIndex] = newID;
    JSTimersExecution.callbacks[freeIndex] = func;
    JSTimersExecution.types[freeIndex] = JSTimersExecution.Type.requestAnimationFrame;
    RCTTiming.createTimer(newID, 1, Date.now(), /** recurring */ false);
    return newID;
  },

  clearTimeout: function(timerID) {
    JSTimers._clearTimerID(timerID);
  },

  clearInterval: function(timerID) {
    JSTimers._clearTimerID(timerID);
  },

  clearImmediate: function(timerID) {
    JSTimers._clearTimerID(timerID);
    JSTimersExecution.immediates.splice(
      JSTimersExecution.immediates.indexOf(timerID),
      1
    );
  },

  cancelAnimationFrame: function(timerID) {
    JSTimers._clearTimerID(timerID);
  },

  _clearTimerID: function(timerID) {
    // JSTimersExecution.timerIDs contains nulls after timers have been removed;
    // ignore nulls upfront so indexOf doesn't find them
    if (timerID == null) {
      return;
    }

    var index = JSTimersExecution.timerIDs.indexOf(timerID);
    // See corresponding comment in `callTimers` for reasoning behind this
    if (index !== -1) {
      JSTimersExecution._clearIndex(index);
      if (JSTimersExecution.types[index] !== JSTimersExecution.Type.setImmediate) {
        RCTTiming.deleteTimer(timerID);
      }
    }
  },
};

module.exports = JSTimers;
