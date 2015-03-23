/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule JSTimersExecution
 */
'use strict';

var invariant = require('invariant');
var keyMirror = require('keyMirror');
var performanceNow = require('performanceNow');
var warning = require('warning');

/**
 * JS implementation of timer functions. Must be completely driven by an
 * external clock signal, all that's stored here is timerID, timer type, and
 * callback.
 */
var JSTimersExecution = {
  GUID: 1,
  Type: keyMirror({
    setTimeout: null,
    setInterval: null,
    requestAnimationFrame: null,
    setImmediate: null,
  }),

  // Parallel arrays:
  callbacks: [],
  types: [],
  timerIDs: [],
  immediates: [],

  /**
   * Calls the callback associated with the ID. Also unregister that callback
   * if it was a one time timer (setTimeout), and not unregister it if it was
   * recurring (setInterval).
   */
  callTimer: function(timerID) {
    warning(timerID <= JSTimersExecution.GUID, 'Tried to call timer with ID ' + timerID + ' but no such timer exists');
    var timerIndex = JSTimersExecution.timerIDs.indexOf(timerID);
    // timerIndex of -1 means that no timer with that ID exists. There are
    // two situations when this happens, when a garbage timer ID was given
    // and when a previously existing timer was deleted before this callback
    // fired. In both cases we want to ignore the timer id, but in the former
    // case we warn as well.
    if (timerIndex === -1) {
      return;
    }
    var type = JSTimersExecution.types[timerIndex];
    var callback = JSTimersExecution.callbacks[timerIndex];

    // Clear the metadata
    if (type === JSTimersExecution.Type.setTimeout ||
        type === JSTimersExecution.Type.setImmediate ||
        type === JSTimersExecution.Type.requestAnimationFrame) {
      JSTimersExecution._clearIndex(timerIndex);
    }

    try {
      if (type === JSTimersExecution.Type.setTimeout ||
          type === JSTimersExecution.Type.setInterval ||
          type === JSTimersExecution.Type.setImmediate) {
        callback();
      } else if (type === JSTimersExecution.Type.requestAnimationFrame) {
        var currentTime = performanceNow();
        callback(currentTime);
      } else {
        console.error('Tried to call a callback with invalid type: ' + type);
        return;
      }
    } catch (e) {
      // Don't rethrow so that we can run every other timer.
      JSTimersExecution.errors = JSTimersExecution.errors || [];
      JSTimersExecution.errors.push(e);
    }
  },

  /**
   * This is called from the native side. We are passed an array of timerIDs,
   * and
   */
  callTimers: function(timerIDs) {
    invariant(timerIDs.length !== 0, 'Probably shouldn\'t call "callTimers" with no timerIDs');

    JSTimersExecution.errors = null;
    timerIDs.forEach(JSTimersExecution.callTimer);

    var errors = JSTimersExecution.errors;
    if (errors) {
      var errorCount = errors.length;
      if (errorCount > 1) {
        // Throw all the other errors in a setTimeout, which will throw each
        // error one at a time
        for (var ii = 1; ii < errorCount; ii++) {
          require('JSTimers').setTimeout(
            ((error) => { throw error; }).bind(null, errors[ii]),
            0
          );
        }
      }
      throw errors[0];
    }
  },

  /**
   * This is called after we execute any command we receive from native but
   * before we hand control back to native.
   */
  callImmediates: function() {
    JSTimersExecution.errors = null;
    while (JSTimersExecution.immediates.length !== 0) {
      JSTimersExecution.callTimer(JSTimersExecution.immediates.shift());
    }
    if (JSTimersExecution.errors) {
      JSTimersExecution.errors.forEach((error) =>
        require('JSTimers').setTimeout(() => { throw error; }, 0)
      );
    }
  },

  _clearIndex: function(i) {
    JSTimersExecution.timerIDs[i] = null;
    JSTimersExecution.callbacks[i] = null;
    JSTimersExecution.types[i] = null;
  },
};

module.exports = JSTimersExecution;
