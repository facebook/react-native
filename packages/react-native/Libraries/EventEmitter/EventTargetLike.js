/**
 * @flow strict-local
 * @format
 */

import type {EventSubscription} from '../vendor/emitter/EventEmitter';

/**
 * EventTarget adapter
 *
 * Options supported:
 *  - `once` (boolean) - If true, the listener would be automatically removed when invoked
 *  - `signal` (AbortSignal) - The listener will be removed when the abort() method of the AbortController which owns the AbortSignal is called
 *
 * see: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 */
export const adaptToEventTarget = <
  R: EventSubscription | {remove(): void, ...},
>(
  addEventListener: (
    ...// $FlowFixMe[unclear-type]
    args: any[]
  ) => R,
  type: mixed,
  listener: mixed,
  options?: ?{|once?: ?boolean, signal?: ?AbortSignal|},
): R => {
  // Extract options to avoid mutation issues
  const abortSignal = options?.signal;
  const once = options?.once;

  const subscription: R = addEventListener(type, (...args) => {
    once === true && subscription.remove();
    // $FlowFixMe[not-a-function]
    listener(...args);
  });

  // If already aborted, remove subscription immediately
  if (abortSignal?.aborted) {
    subscription.remove();
    return subscription;
  }

  // Remove subscription if the abort signal is triggered
  if (abortSignal) {
    abortSignal.addEventListener(
      'abort',
      () => subscription.remove(),
      // Note: `once` option is supported by `event-target-shim` which is used by `abort-controller`
      {once: true},
    );
  }

  return subscription;
};
