/**
 * The abort-controller polyfill does not implement parts of the modern API:
 *  - AbortSignal.timeout — https://github.com/mysticatea/abort-controller/issues/35
 *  - AbortSignal.any — https://github.com/mysticatea/abort-controller/issues/40
 *  - AbortSignal::reason — https://github.com/mysticatea/abort-controller/issues/36
 *
 * The package has not been updated for 7 years, so I (retyui) decided to patch it locally.
 */
import {
  AbortController,
  AbortSignal,
} from "abort-controller/dist/abort-controller";


const defineProperty = (obj, key, value) =>
  Object.defineProperty(obj, key, {
    writable: true,
    enumerable: true,
    configurable: true,
    value,
  });

const isReasonSupported = () => {
  try {
    const controller = new AbortController();
    controller.abort("test reason");
    return controller.signal.reason === "test reason";
  } catch {
    return false;
  }
};


// 1. AbortSignal::reason polyfill
// Docs: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/reason
// Spec: https://dom.spec.whatwg.org/#dom-abortsignal-reason
if (!isReasonSupported()) {
  const originalAbort = AbortController.prototype.abort;
  const reasonsMap = new WeakMap();

  Object.defineProperty(AbortSignal.prototype, "reason", {
    enumerable: true,
    configurable: true,
    get() {
      return reasonsMap.get(this);
    },
  });

  defineProperty(AbortController.prototype, "abort", function (reason) {
    if (this.signal.aborted) {
      return; // already aborted
    }
    // AbortError: https://developer.mozilla.org/en-US/docs/Web/API/DOMException#aborterror
    const abortError = new Error("signal is aborted without reason");
    abortError.name = "AbortError";
    abortError.code = 20;
    reasonsMap.set(this.signal, reason === undefined ? abortError : reason);
    originalAbort.call(this);
  });
}

// 2. AbortSignal.timeout static method polyfill
// Docs: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
// Spec: https://dom.spec.whatwg.org/#dom-abortsignal-timeout
if (typeof AbortSignal.timeout !== "function") {
  defineProperty(AbortSignal, "timeout", function (timeInMs) {
    const isPositiveNumber = timeInMs >= 0;

    if (!isPositiveNumber) {
      throw new TypeError(
        "Failed to execute 'timeout' on 'AbortSignal': The provided value have to be a non-negative number.",
      );
    }

    const controller = new AbortController();

    setTimeout(() => {
      // TimeoutError: https://developer.mozilla.org/en-US/docs/Web/API/DOMException#timeouterror
      const timeoutError = new Error("signal timed out");
      timeoutError.name = "TimeoutError";
      timeoutError.code = 23;
      controller.abort(timeoutError);
    }, timeInMs);

    return controller.signal;
  });
}


// 3. AbortSignal.any static method polyfill
// Docs: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static
// Spec: https://dom.spec.whatwg.org/#dom-abortsignal-any
if (typeof AbortSignal.any !== "function") {
  defineProperty(AbortSignal, "any", function (signals) {
    if (!Array.isArray(signals)) {
      throw new Error("The signals value must be an instance of Array");
    }

    const controller = new AbortController();
    const listeners = [];
    const cleanup = () => listeners.forEach((unsubscribe) => unsubscribe());

    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];

      // Validate that each item is an AbortSignal
      if (!(signal instanceof AbortSignal)) {
        cleanup(); // Remove all listeners added so far
        throw new Error(
          'The "signals[' +
          i +
          ']" argument must be an instance of AbortSignal',
        );
      }

      // Abort immediately if one of the signals is already aborted
      if (signal.aborted) {
        cleanup(); // Remove all listeners added so far
        controller.abort(signal.reason);
        break;
      }

      const onAbort = () => controller.abort(signal.reason);
      signal.addEventListener("abort", onAbort, { once: true });
      listeners.push(() => signal.removeEventListener("abort", onAbort));
    }

    return controller.signal;
  });
}

export { AbortController, AbortSignal };
