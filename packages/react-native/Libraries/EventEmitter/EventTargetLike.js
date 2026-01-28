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
  // $FlowFixMe[unclear-type]
  addEventListener: (...args: any[]) => R,
  type: mixed,
  listener: mixed,
  options?: ?{|once?: ?boolean, signal?: ?mixed|},
): R => {
  // Extract options to avoid mutation issues
  // $FlowFixMe[incompatible-type]
  const signal: ?AbortSignal = options?.signal;
  const once = options?.once;

  if (signal !== undefined && !(signal instanceof AbortSignal)) {
    throw new TypeError(
      "Failed to execute 'addEventListener': Failed to convert the 'signal' value to 'AbortSignal'.",
    );
  }

  const subscription: R = addEventListener(type, (...args) => {
    // $FlowFixMe[sketchy-null-bool]
    if (once) {
      subscription.remove();
      signal?.removeEventListener('abort', onAbort);
    }
    // $FlowFixMe[not-a-function]
    return listener(...args);
  });

  // If already aborted, remove subscription immediately
  if (signal?.aborted) {
    subscription.remove();
    return subscription;
  }

  // Remove subscription if the abort signal is triggered
  const onAbort = () => subscription.remove();
  signal?.addEventListener('abort', onAbort, {once: true}); // Note: `once` option is supported by `event-target-shim` which is used by `abort-controller` polyfill

  // $FlowFixMe[incompatible-type]
  return Object.create(
    // $FlowFixMe[not-an-object]
    subscription,
    {
      remove: {
        writable: true,
        enumerable: true,
        configurable: true,
        value: () => {
          subscription.remove();
          signal?.removeEventListener('abort', onAbort);
        },
      },
    },
  );
};
