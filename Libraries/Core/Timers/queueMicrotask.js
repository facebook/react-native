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

let resolvedPromise;

/**
 * Polyfill for the microtask queuening API defined by WHATWG HTMP spec.
 * https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-queuemicrotask
 *
 * The method must queue a microtask to invoke @param {function} callback, and
 * if the callback throws an exception, report the exception.
 */
export default function queueMicrotask(callback: Function) {
  if (arguments.length < 1) {
    throw new TypeError(
      'queueMicrotask must be called with at least one argument (a function to call)',
    );
  }
  if (typeof callback !== 'function') {
    throw new TypeError('The argument to queueMicrotask must be a function.');
  }

  // Try to reuse a lazily allocated resolved promise from closure.
  (resolvedPromise || (resolvedPromise = Promise.resolve()))
    .then(callback)
    .catch(error =>
      // Report the exception until the next tick.
      setTimeout(() => {
        throw error;
      }, 0),
    );
}
