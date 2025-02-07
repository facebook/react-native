/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {EventSubscription} from '../vendor/emitter/EventEmitter';

const invariant = require('invariant');

export type Handle = number;

type Task =
  | {
      name: string,
      run: () => void,
    }
  | {
      name: string,
      gen: () => Promise<void>,
    }
  | (() => void);

// NOTE: The original implementation of `InteractionManager` never rejected
// the returned promise. This preserves that behavior in the stub.
function reject(error: Error): void {
  setTimeout(() => {
    throw error;
  }, 0);
}

/**
 * InteractionManager allows long-running work to be scheduled after any
 * interactions/animations have completed. In particular, this allows JavaScript
 * animations to run smoothly.
 *
 * Applications can schedule tasks to run after interactions with the following:
 *
 * ```
 * InteractionManager.runAfterInteractions(() => {
 *   // ...long-running synchronous task...
 * });
 * ```
 *
 * Compare this to other scheduling alternatives:
 *
 * - requestAnimationFrame(): for code that animates a view over time.
 * - setImmediate/setTimeout(): run code later, note this may delay animations.
 * - runAfterInteractions(): run code later, without delaying active animations.
 *
 * The touch handling system considers one or more active touches to be an
 * 'interaction' and will delay `runAfterInteractions()` callbacks until all
 * touches have ended or been cancelled.
 *
 * InteractionManager also allows applications to register animations by
 * creating an interaction 'handle' on animation start, and clearing it upon
 * completion:
 *
 * ```
 * var handle = InteractionManager.createInteractionHandle();
 * // run animation... (`runAfterInteractions` tasks are queued)
 * // later, on animation completion:
 * InteractionManager.clearInteractionHandle(handle);
 * // queued tasks run if all handles were cleared
 * ```
 *
 * `runAfterInteractions` takes either a plain callback function, or a
 * `PromiseTask` object with a `gen` method that returns a `Promise`.  If a
 * `PromiseTask` is supplied, then it is fully resolved (including asynchronous
 * dependencies that also schedule more tasks via `runAfterInteractions`) before
 * starting on the next task that might have been queued up synchronously
 * earlier.
 *
 * By default, queued tasks are executed together in a loop in one
 * `setImmediate` batch. If `setDeadline` is called with a positive number, then
 * tasks will only be executed until the deadline (in terms of js event loop run
 * time) approaches, at which point execution will yield via setTimeout,
 * allowing events such as touches to start interactions and block queued tasks
 * from executing, making apps more responsive.
 *
 * @deprecated
 */
const InteractionManagerStub = {
  Events: {
    interactionStart: 'interactionStart',
    interactionComplete: 'interactionComplete',
  },

  /**
   * Schedule a function to run after all interactions have completed. Returns a cancellable
   * "promise".
   *
   * @deprecated
   */
  runAfterInteractions(task: ?Task): {
    then: <U>(
      onFulfill?: ?(void) => ?(Promise<U> | U),
      onReject?: ?(error: mixed) => ?(Promise<U> | U),
    ) => Promise<U>,
    cancel: () => void,
    ...
  } {
    let immediateID: ?$FlowIssue;
    const promise = new Promise(resolve => {
      immediateID = setImmediate(() => {
        if (typeof task === 'object' && task !== null) {
          if (typeof task.gen === 'function') {
            task.gen().then(resolve, reject);
          } else if (typeof task.run === 'function') {
            try {
              task.run();
              resolve();
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new TypeError(`Task "${task.name}" missing gen or run.`));
          }
        } else if (typeof task === 'function') {
          try {
            task();
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new TypeError('Invalid task of type: ' + typeof task));
        }
      });
    });

    return {
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      then: promise.then.bind(promise),
      cancel() {
        clearImmediate(immediateID);
      },
    };
  },

  /**
   * Notify manager that an interaction has started.
   *
   * @deprecated
   */
  createInteractionHandle(): Handle {
    return -1;
  },

  /**
   * Notify manager that an interaction has completed.
   *
   * @deprecated
   */
  clearInteractionHandle(handle: Handle) {
    invariant(!!handle, 'InteractionManager: Must provide a handle to clear.');
  },

  /**
   * @deprecated
   */
  addListener(): EventSubscription {
    return {
      remove() {},
    };
  },

  /**
   * A positive number will use setTimeout to schedule any tasks after the
   * eventLoopRunningTime hits the deadline value, otherwise all tasks will be
   * executed in one setImmediate batch (default).
   *
   * @deprecated
   */
  setDeadline(deadline: number) {
    // Do nothing.
  },
};

export default InteractionManagerStub;
