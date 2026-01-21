/**
 * The abort-controller polyfill does not implement parts of the modern API:
 *  - AbortSignal.timeout — https://github.com/mysticatea/abort-controller/issues/35
 *  - AbortSignal.any — https://github.com/mysticatea/abort-controller/issues/40
 *
 * The package has not been updated for 8 years, so I (retyui) decided to patch it locally.
 */
import  {AbortController, AbortSignal} from 'abort-controller/dist/abort-controller';

// Docs: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
// Spec: https://dom.spec.whatwg.org/#dom-abortsignal-timeout
if (typeof AbortSignal.timeout !== 'function') {
  Object.defineProperty(AbortSignal, 'timeout', {
    writable: true,
    enumerable: false,
    configurable: true,
    value: function(timeInMs) {
      const isPositiveNumber = timeInMs >= 0;

      if (!isPositiveNumber) {
        throw new TypeError(
          "Failed to execute 'timeout' on 'AbortSignal': The provided value have to be a non-negative number.",
        );
      }

      const controller = new AbortController();

      setTimeout(() => {
        const error = new Error('The operation timed out.');
        error.name = 'TimeoutError';
        controller.abort(error);
      }, timeInMs);

      return controller.signal;
    },
  });
}


// Docs: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static
// Spec: https://dom.spec.whatwg.org/#dom-abortsignal-any
if (typeof AbortSignal.any !== 'function') {
  Object.defineProperty(AbortSignal, 'any', {
    writable: true,
    enumerable: false,
    configurable: true,
    value: function(signals) {
      if(!Array.isArray(signals)) {
        throw new Error('The signals value must be an instance of Array');
      }

      const controller = new AbortController();
      const listeners = [];
      const cleanup = () => listeners.forEach(unsubscribe => unsubscribe());

      for (let i = 0; i < signals.length; i++) {
        const signal = signals[i];

        // Validate that each item is an AbortSignal
        if (!(signal instanceof AbortSignal)) {
          cleanup(); // Remove all listeners added so far
          throw new Error('The "signals['+i+']" argument must be an instance of AbortSignal');
        }

        // Abort immediately if one of the signals is already aborted
        if (signal.aborted) {
          cleanup(); // Remove all listeners added so far
          controller.abort(signal.reason);
          break;
        }

        const onAbort = () => controller.abort(signal.reason);
        signal.addEventListener('abort', onAbort, { once: true });
        listeners.push(() => signal.removeEventListener('abort', onAbort));
      }

      return controller.signal;
    },
  });
}


export {
  AbortController,
  AbortSignal,
}
