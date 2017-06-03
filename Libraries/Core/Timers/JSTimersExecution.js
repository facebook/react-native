/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule JSTimersExecution
 * @flow
 */
'use strict';

const Systrace = require('Systrace');

const invariant = require('fbjs/lib/invariant');
const performanceNow = require('fbjs/lib/performanceNow');
const warning = require('fbjs/lib/warning');

// These timing contants should be kept in sync with the ones in native ios and
// android `RCTTiming` module.
const FRAME_DURATION = 1000 / 60;
const IDLE_CALLBACK_FRAME_DEADLINE = 1;

let hasEmittedTimeDriftWarning = false;

export type JSTimerType =
  'setTimeout' |
  'setInterval' |
  'requestAnimationFrame' |
  'setImmediate' |
  'requestIdleCallback';

/**
 * JS implementation of timer functions. Must be completely driven by an
 * external clock signal, all that's stored here is timerID, timer type, and
 * callback.
 */
const JSTimersExecution = {
  GUID: 1,

  // Parallel arrays
  callbacks: ([] : Array<?Function>),
  types: ([] : Array<?JSTimerType>),
  timerIDs: ([] : Array<?number>),
  immediates: [],
  requestIdleCallbacks: [],
  requestIdleCallbackTimeouts: (new Map() : Map<number, number>),
  identifiers: ([] : Array<null | {methodName: string}>),

  errors: (null : ?Array<Error>),

  /**
   * Calls the callback associated with the ID. Also unregister that callback
   * if it was a one time timer (setTimeout), and not unregister it if it was
   * recurring (setInterval).
   */
  callTimer(timerID: number, frameTime: number, didTimeout: ?boolean) {
    warning(
      timerID <= JSTimersExecution.GUID,
      'Tried to call timer with ID %s but no such timer exists.',
      timerID
    );

    // timerIndex of -1 means that no timer with that ID exists. There are
    // two situations when this happens, when a garbage timer ID was given
    // and when a previously existing timer was deleted before this callback
    // fired. In both cases we want to ignore the timer id, but in the former
    // case we warn as well.
    const timerIndex = JSTimersExecution.timerIDs.indexOf(timerID);
    if (timerIndex === -1) {
      return;
    }

    const type = JSTimersExecution.types[timerIndex];
    const callback = JSTimersExecution.callbacks[timerIndex];
    if (!callback || !type) {
      console.error('No callback found for timerID ' + timerID);
      return;
    }

    if (__DEV__) {
      const identifier = JSTimersExecution.identifiers[timerIndex] || {};
      Systrace.beginEvent('Systrace.callTimer: ' + identifier.methodName);
    }

    // Clear the metadata
    if (type === 'setTimeout' || type === 'setImmediate' ||
        type === 'requestAnimationFrame' || type === 'requestIdleCallback') {
      JSTimersExecution._clearIndex(timerIndex);
    }

    try {
      if (type === 'setTimeout' || type === 'setInterval' ||
          type === 'setImmediate') {
        callback();
      } else if (type === 'requestAnimationFrame') {
        callback(performanceNow());
      } else if (type === 'requestIdleCallback') {
        callback({
          timeRemaining: function() {
            // TODO: Optimisation: allow running for longer than one frame if
            // there are no pending JS calls on the bridge from native. This
            // would require a way to check the bridge queue synchronously.
            return Math.max(0, FRAME_DURATION - (performanceNow() - frameTime));
          },
          didTimeout: !!didTimeout,
        });
      } else {
        console.error('Tried to call a callback with invalid type: ' + type);
      }
    } catch (e) {
      // Don't rethrow so that we can run all timers.
      if (!JSTimersExecution.errors) {
        JSTimersExecution.errors = [e];
      } else {
        JSTimersExecution.errors.push(e);
      }
    }

    if (__DEV__) {
      Systrace.endEvent();
    }
  },

  /**
   * This is called from the native side. We are passed an array of timerIDs,
   * and
   */
  callTimers(timerIDs: [number]) {
    invariant(
      timerIDs.length !== 0,
      'Cannot call `callTimers` with an empty list of IDs.'
    );

    JSTimersExecution.errors = null;
    for (let i = 0; i < timerIDs.length; i++) {
      JSTimersExecution.callTimer(timerIDs[i], 0);
    }

    const errors = JSTimersExecution.errors;
    if (errors) {
      const errorCount = errors.length;
      if (errorCount > 1) {
        // Throw all the other errors in a setTimeout, which will throw each
        // error one at a time
        for (let ii = 1; ii < errorCount; ii++) {
          require('JSTimers').setTimeout(
            ((error) => { throw error; }).bind(null, errors[ii]),
            0
          );
        }
      }
      throw errors[0];
    }
  },

  callIdleCallbacks: function(frameTime: number) {
    if (FRAME_DURATION - (performanceNow() - frameTime) < IDLE_CALLBACK_FRAME_DEADLINE) {
      return;
    }

    JSTimersExecution.errors = null;
    if (JSTimersExecution.requestIdleCallbacks.length > 0) {
      const passIdleCallbacks = JSTimersExecution.requestIdleCallbacks.slice();
      JSTimersExecution.requestIdleCallbacks = [];

      for (let i = 0; i < passIdleCallbacks.length; ++i) {
        JSTimersExecution.callTimer(passIdleCallbacks[i], frameTime);
      }
    }

    if (JSTimersExecution.requestIdleCallbacks.length === 0) {
      const { Timing } = require('NativeModules');
      Timing.setSendIdleEvents(false);
    }

    if (JSTimersExecution.errors) {
      JSTimersExecution.errors.forEach((error) =>
        require('JSTimers').setTimeout(() => { throw error; }, 0)
      );
    }
  },

  /**
   * Performs a single pass over the enqueued immediates. Returns whether
   * more immediates are queued up (can be used as a condition a while loop).
   */
  callImmediatesPass() {
    if (__DEV__) {
      Systrace.beginEvent('JSTimersExecution.callImmediatesPass()');
    }

    // The main reason to extract a single pass is so that we can track
    // in the system trace
    if (JSTimersExecution.immediates.length > 0) {
      const passImmediates = JSTimersExecution.immediates.slice();
      JSTimersExecution.immediates = [];

      // Use for loop rather than forEach as per @vjeux's advice
      // https://github.com/facebook/react-native/commit/c8fd9f7588ad02d2293cac7224715f4af7b0f352#commitcomment-14570051
      for (let i = 0; i < passImmediates.length; ++i) {
        JSTimersExecution.callTimer(passImmediates[i], 0);
      }
    }

    if (__DEV__) {
      Systrace.endEvent();
    }
    return JSTimersExecution.immediates.length > 0;
  },

  /**
   * This is called after we execute any command we receive from native but
   * before we hand control back to native.
   */
  callImmediates() {
    JSTimersExecution.errors = null;
    while (JSTimersExecution.callImmediatesPass()) {}
    if (JSTimersExecution.errors) {
      JSTimersExecution.errors.forEach((error) =>
        require('JSTimers').setTimeout(() => { throw error; }, 0)
      );
    }
  },

  /**
   * Called from native (in development) when environment times are out-of-sync.
   */
  emitTimeDriftWarning(warningMessage: string) {
    if (hasEmittedTimeDriftWarning) {
      return;
    }
    hasEmittedTimeDriftWarning = true;
    console.warn(warningMessage);
  },

  _clearIndex(i: number) {
    JSTimersExecution.timerIDs[i] = null;
    JSTimersExecution.callbacks[i] = null;
    JSTimersExecution.types[i] = null;
    JSTimersExecution.identifiers[i] = null;
  },
};

module.exports = JSTimersExecution;
