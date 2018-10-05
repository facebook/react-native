/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
'use strict';

const Platform = require('Platform');
const Systrace = require('Systrace');

const invariant = require('fbjs/lib/invariant');
const {Timing} = require('NativeModules');
const BatchedBridge = require('BatchedBridge');

import type {ExtendedError} from 'parseErrorStack';

let _performanceNow = null;
function performanceNow() {
  if (!_performanceNow) {
    /* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an
     * error found when Flow v0.54 was deployed. To see the error delete this
     * comment and run Flow. */
    _performanceNow = require('fbjs/lib/performanceNow');
  }
  return _performanceNow();
}

/**
 * JS implementation of timer functions. Must be completely driven by an
 * external clock signal, all that's stored here is timerID, timer type, and
 * callback.
 */

export type JSTimerType =
  | 'setTimeout'
  | 'setInterval'
  | 'requestAnimationFrame'
  | 'setImmediate'
  | 'requestIdleCallback';

// These timing constants should be kept in sync with the ones in native ios and
// android `RCTTiming` module.
const FRAME_DURATION = 1000 / 60;
const IDLE_CALLBACK_FRAME_DEADLINE = 1;

const MAX_TIMER_DURATION_MS = 60 * 1000;
const IS_ANDROID = Platform.OS === 'android';
const ANDROID_LONG_TIMER_MESSAGE =
  'Setting a timer for a long period of time, i.e. multiple minutes, is a ' +
  'performance and correctness issue on Android as it keeps the timer ' +
  'module awake, and timers can only be called when the app is in the foreground. ' +
  'See https://github.com/facebook/react-native/issues/12981 for more info.';

// Parallel arrays
const callbacks: Array<?Function> = [];
const types: Array<?JSTimerType> = [];
const timerIDs: Array<?number> = [];
let immediates: Array<number> = [];
let requestIdleCallbacks: Array<number> = [];
const requestIdleCallbackTimeouts: {[number]: number} = {};
const identifiers: Array<null | {methodName: string}> = [];

let GUID = 1;
let errors: ?Array<Error> = null;

let hasEmittedTimeDriftWarning = false;

// Returns a free index if one is available, and the next consecutive index otherwise.
function _getFreeIndex(): number {
  let freeIndex = timerIDs.indexOf(null);
  if (freeIndex === -1) {
    freeIndex = timerIDs.length;
  }
  return freeIndex;
}

function _allocateCallback(func: Function, type: JSTimerType): number {
  const id = GUID++;
  const freeIndex = _getFreeIndex();
  timerIDs[freeIndex] = id;
  callbacks[freeIndex] = func;
  types[freeIndex] = type;
  if (__DEV__) {
    const parseErrorStack = require('parseErrorStack');
    const error: ExtendedError = new Error();
    error.framesToPop = 1;
    const stack = parseErrorStack(error);
    if (stack) {
      identifiers[freeIndex] = stack.shift();
    }
  }
  return id;
}

/**
 * Calls the callback associated with the ID. Also unregister that callback
 * if it was a one time timer (setTimeout), and not unregister it if it was
 * recurring (setInterval).
 */
function _callTimer(timerID: number, frameTime: number, didTimeout: ?boolean) {
  /* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an
   * error found when Flow v0.54 was deployed. To see the error delete this
   * comment and run Flow. */
  require('fbjs/lib/warning')(
    timerID <= GUID,
    'Tried to call timer with ID %s but no such timer exists.',
    timerID,
  );

  // timerIndex of -1 means that no timer with that ID exists. There are
  // two situations when this happens, when a garbage timer ID was given
  // and when a previously existing timer was deleted before this callback
  // fired. In both cases we want to ignore the timer id, but in the former
  // case we warn as well.
  const timerIndex = timerIDs.indexOf(timerID);
  if (timerIndex === -1) {
    return;
  }

  const type = types[timerIndex];
  const callback = callbacks[timerIndex];
  if (!callback || !type) {
    console.error('No callback found for timerID ' + timerID);
    return;
  }

  if (__DEV__) {
    const identifier = identifiers[timerIndex] || {};
    Systrace.beginEvent('Systrace.callTimer: ' + identifier.methodName);
  }

  // Clear the metadata
  if (
    type === 'setTimeout' ||
    type === 'setImmediate' ||
    type === 'requestAnimationFrame' ||
    type === 'requestIdleCallback'
  ) {
    _clearIndex(timerIndex);
  }

  try {
    if (
      type === 'setTimeout' ||
      type === 'setInterval' ||
      type === 'setImmediate'
    ) {
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
    if (!errors) {
      errors = [e];
    } else {
      errors.push(e);
    }
  }

  if (__DEV__) {
    Systrace.endEvent();
  }
}

/**
 * Performs a single pass over the enqueued immediates. Returns whether
 * more immediates are queued up (can be used as a condition a while loop).
 */
function _callImmediatesPass() {
  if (__DEV__) {
    Systrace.beginEvent('callImmediatesPass()');
  }

  // The main reason to extract a single pass is so that we can track
  // in the system trace
  if (immediates.length > 0) {
    const passImmediates = immediates.slice();
    immediates = [];

    // Use for loop rather than forEach as per @vjeux's advice
    // https://github.com/facebook/react-native/commit/c8fd9f7588ad02d2293cac7224715f4af7b0f352#commitcomment-14570051
    for (let i = 0; i < passImmediates.length; ++i) {
      _callTimer(passImmediates[i], 0);
    }
  }

  if (__DEV__) {
    Systrace.endEvent();
  }
  return immediates.length > 0;
}

function _clearIndex(i: number) {
  timerIDs[i] = null;
  callbacks[i] = null;
  types[i] = null;
  identifiers[i] = null;
}

function _freeCallback(timerID: number) {
  // timerIDs contains nulls after timers have been removed;
  // ignore nulls upfront so indexOf doesn't find them
  if (timerID == null) {
    return;
  }

  const index = timerIDs.indexOf(timerID);
  // See corresponding comment in `callTimers` for reasoning behind this
  if (index !== -1) {
    _clearIndex(index);
    const type = types[index];
    if (type !== 'setImmediate' && type !== 'requestIdleCallback') {
      Timing.deleteTimer(timerID);
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
  setTimeout: function(func: Function, duration: number, ...args: any): number {
    if (__DEV__ && IS_ANDROID && duration > MAX_TIMER_DURATION_MS) {
      console.warn(
        ANDROID_LONG_TIMER_MESSAGE +
          '\n' +
          '(Saw setTimeout with duration ' +
          duration +
          'ms)',
      );
    }
    const id = _allocateCallback(
      () => func.apply(undefined, args),
      'setTimeout',
    );
    Timing.createTimer(id, duration || 0, Date.now(), /* recurring */ false);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every `duration` ms.
   * @param {number} duration Number of milliseconds.
   */
  setInterval: function(
    func: Function,
    duration: number,
    ...args: any
  ): number {
    if (__DEV__ && IS_ANDROID && duration > MAX_TIMER_DURATION_MS) {
      console.warn(
        ANDROID_LONG_TIMER_MESSAGE +
          '\n' +
          '(Saw setInterval with duration ' +
          duration +
          'ms)',
      );
    }
    const id = _allocateCallback(
      () => func.apply(undefined, args),
      'setInterval',
    );
    Timing.createTimer(id, duration || 0, Date.now(), /* recurring */ true);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked before the end of the
   * current JavaScript execution loop.
   */
  /* $FlowFixMe(>=0.79.1 site=react_native_fb) This comment suppresses an
   * error found when Flow v0.79 was deployed. To see the error delete this
   * comment and run Flow. */
  setImmediate: function(func: Function, ...args: any) {
    const id = _allocateCallback(
      () => func.apply(undefined, args),
      'setImmediate',
    );
    immediates.push(id);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every frame.
   */
  /* $FlowFixMe(>=0.79.1 site=react_native_fb) This comment suppresses an
   * error found when Flow v0.79 was deployed. To see the error delete this
   * comment and run Flow. */
  requestAnimationFrame: function(func: Function) {
    const id = _allocateCallback(func, 'requestAnimationFrame');
    Timing.createTimer(id, 1, Date.now(), /* recurring */ false);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every frame and provided
   * with time remaining in frame.
   * @param {?object} options
   */
  /* $FlowFixMe(>=0.79.1 site=react_native_fb) This comment suppresses an
   * error found when Flow v0.79 was deployed. To see the error delete this
   * comment and run Flow. */
  requestIdleCallback: function(func: Function, options: ?Object) {
    if (requestIdleCallbacks.length === 0) {
      Timing.setSendIdleEvents(true);
    }

    const timeout = options && options.timeout;
    const id = _allocateCallback(
      timeout != null
        ? deadline => {
            const timeoutId = requestIdleCallbackTimeouts[id];
            if (timeoutId) {
              JSTimers.clearTimeout(timeoutId);
              delete requestIdleCallbackTimeouts[id];
            }
            return func(deadline);
          }
        : func,
      'requestIdleCallback',
    );
    requestIdleCallbacks.push(id);

    if (timeout != null) {
      const timeoutId = JSTimers.setTimeout(() => {
        const index = requestIdleCallbacks.indexOf(id);
        if (index > -1) {
          requestIdleCallbacks.splice(index, 1);
          _callTimer(id, performanceNow(), true);
        }
        delete requestIdleCallbackTimeouts[id];
        if (requestIdleCallbacks.length === 0) {
          Timing.setSendIdleEvents(false);
        }
      }, timeout);
      requestIdleCallbackTimeouts[id] = timeoutId;
    }
    return id;
  },

  cancelIdleCallback: function(timerID: number) {
    _freeCallback(timerID);
    const index = requestIdleCallbacks.indexOf(timerID);
    if (index !== -1) {
      requestIdleCallbacks.splice(index, 1);
    }

    const timeoutId = requestIdleCallbackTimeouts[timerID];
    if (timeoutId) {
      JSTimers.clearTimeout(timeoutId);
      delete requestIdleCallbackTimeouts[timerID];
    }

    if (requestIdleCallbacks.length === 0) {
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
    const index = immediates.indexOf(timerID);
    if (index !== -1) {
      immediates.splice(index, 1);
    }
  },

  cancelAnimationFrame: function(timerID: number) {
    _freeCallback(timerID);
  },

  /**
   * This is called from the native side. We are passed an array of timerIDs,
   * and
   */
  callTimers: function(timersToCall: Array<number>) {
    invariant(
      timersToCall.length !== 0,
      'Cannot call `callTimers` with an empty list of IDs.',
    );

    // $FlowFixMe: optionals do not allow assignment from null
    errors = null;
    for (let i = 0; i < timersToCall.length; i++) {
      _callTimer(timersToCall[i], 0);
    }

    if (errors) {
      const errorCount = errors.length;
      if (errorCount > 1) {
        // Throw all the other errors in a setTimeout, which will throw each
        // error one at a time
        for (let ii = 1; ii < errorCount; ii++) {
          JSTimers.setTimeout(
            (error => {
              throw error;
            }).bind(null, errors[ii]),
            0,
          );
        }
      }
      throw errors[0];
    }
  },

  callIdleCallbacks: function(frameTime: number) {
    if (
      FRAME_DURATION - (performanceNow() - frameTime) <
      IDLE_CALLBACK_FRAME_DEADLINE
    ) {
      return;
    }

    // $FlowFixMe: optionals do not allow assignment from null
    errors = null;
    if (requestIdleCallbacks.length > 0) {
      const passIdleCallbacks = requestIdleCallbacks.slice();
      requestIdleCallbacks = [];

      for (let i = 0; i < passIdleCallbacks.length; ++i) {
        _callTimer(passIdleCallbacks[i], frameTime);
      }
    }

    if (requestIdleCallbacks.length === 0) {
      Timing.setSendIdleEvents(false);
    }

    if (errors) {
      errors.forEach(error =>
        JSTimers.setTimeout(() => {
          throw error;
        }, 0),
      );
    }
  },

  /**
   * This is called after we execute any command we receive from native but
   * before we hand control back to native.
   */
  callImmediates() {
    errors = null;
    while (_callImmediatesPass()) {}
    if (errors) {
      errors.forEach(error =>
        JSTimers.setTimeout(() => {
          throw error;
        }, 0),
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
};

let ExportedJSTimers;
if (!Timing) {
  console.warn("Timing native module is not available, can't set timers.");
  // $FlowFixMe: we can assume timers are generally available
  ExportedJSTimers = ({
    callImmediates: JSTimers.callImmediates,
    setImmediate: JSTimers.setImmediate,
  }: typeof JSTimers);
} else {
  ExportedJSTimers = JSTimers;
}

BatchedBridge.setImmediatesCallback(
  ExportedJSTimers.callImmediates.bind(ExportedJSTimers),
);

module.exports = ExportedJSTimers;
