/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const invariant = require('invariant');

const TRACE_TAG_REACT_APPS = 1 << 17; // eslint-disable-line no-bitwise
const TRACE_TAG_JS_VM_CALLS = 1 << 27; // eslint-disable-line no-bitwise

let _enabled = false;
let _asyncCookie = 0;
const _markStack = [];
let _markStackIndex = -1;
let _canInstallReactHook = false;

// Implements a subset of User Timing API necessary for React measurements.
// https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API
const REACT_MARKER = '\u269B';
const userTimingPolyfill = __DEV__
  ? {
      mark(markName: string) {
        if (_enabled) {
          _markStackIndex++;
          _markStack[_markStackIndex] = markName;
          let systraceLabel = markName;
          // Since perf measurements are a shared namespace in User Timing API,
          // we prefix all React results with a React emoji.
          if (markName[0] === REACT_MARKER) {
            // This is coming from React.
            // Removing component IDs keeps trace colors stable.
            const indexOfId = markName.lastIndexOf(' (#');
            const cutoffIndex = indexOfId !== -1 ? indexOfId : markName.length;
            // Also cut off the emoji because it breaks Systrace
            systraceLabel = markName.slice(2, cutoffIndex);
          }
          Systrace.beginEvent(systraceLabel);
        }
      },
      measure(measureName: string, startMark: ?string, endMark: ?string) {
        if (_enabled) {
          invariant(
            typeof measureName === 'string' &&
              typeof startMark === 'string' &&
              typeof endMark === 'undefined',
            'Only performance.measure(string, string) overload is supported.',
          );
          const topMark = _markStack[_markStackIndex];
          invariant(
            startMark === topMark,
            'There was a mismatching performance.measure() call. ' +
              'Expected "%s" but got "%s."',
            topMark,
            startMark,
          );
          _markStackIndex--;
          // We can't use more descriptive measureName because Systrace doesn't
          // let us edit labels post factum.
          Systrace.endEvent();
        }
      },
      clearMarks(markName: string) {
        if (_enabled) {
          if (_markStackIndex === -1) {
            return;
          }
          if (markName === _markStack[_markStackIndex]) {
            // React uses this for "cancelling" started measurements.
            // Systrace doesn't support deleting measurements, so we just stop them.
            if (userTimingPolyfill != null) {
              userTimingPolyfill.measure(markName, markName);
            }
          }
        }
      },
      clearMeasures() {
        // React calls this to avoid memory leaks in browsers, but we don't keep
        // measurements anyway.
      },
    }
  : null;

function installPerformanceHooks(polyfill) {
  if (polyfill) {
    if (global.performance === undefined) {
      global.performance = {};
    }

    Object.keys(polyfill).forEach(methodName => {
      if (typeof global.performance[methodName] !== 'function') {
        global.performance[methodName] = polyfill[methodName];
      }
    });
  }
}

const Systrace = {
  installReactHook() {
    if (_enabled) {
      if (__DEV__) {
        installPerformanceHooks(userTimingPolyfill);
      }
    }
    _canInstallReactHook = true;
  },

  setEnabled(enabled: boolean) {
    if (_enabled !== enabled) {
      if (__DEV__) {
        if (enabled) {
          global.nativeTraceBeginLegacy &&
            global.nativeTraceBeginLegacy(TRACE_TAG_JS_VM_CALLS);
        } else {
          global.nativeTraceEndLegacy &&
            global.nativeTraceEndLegacy(TRACE_TAG_JS_VM_CALLS);
        }
        if (_canInstallReactHook) {
          if (enabled) {
            installPerformanceHooks(userTimingPolyfill);
          }
        }
      }
      _enabled = enabled;
    }
  },

  isEnabled(): boolean {
    return _enabled;
  },

  /**
   * beginEvent/endEvent for starting and then ending a profile within the same call stack frame
   **/
  beginEvent(
    profileName?: string | (() => string),
    args?: {[string]: string, ...},
  ) {
    if (_enabled) {
      const profileNameString =
        typeof profileName === 'function' ? profileName() : profileName;
      global.nativeTraceBeginSection(
        TRACE_TAG_REACT_APPS,
        profileNameString,
        args,
      );
    }
  },

  endEvent() {
    if (_enabled) {
      global.nativeTraceEndSection(TRACE_TAG_REACT_APPS);
    }
  },

  /**
   * beginAsyncEvent/endAsyncEvent for starting and then ending a profile where the end can either
   * occur on another thread or out of the current stack frame, eg await
   * the returned cookie variable should be used as input into the endAsyncEvent call to end the profile
   **/
  beginAsyncEvent(profileName?: string | (() => string)): number {
    const cookie = _asyncCookie;
    if (_enabled) {
      _asyncCookie++;
      const profileNameString =
        typeof profileName === 'function' ? profileName() : profileName;
      global.nativeTraceBeginAsyncSection(
        TRACE_TAG_REACT_APPS,
        profileNameString,
        cookie,
      );
    }
    return cookie;
  },

  endAsyncEvent(profileName?: string | (() => string), cookie?: number) {
    if (_enabled) {
      const profileNameString =
        typeof profileName === 'function' ? profileName() : profileName;
      global.nativeTraceEndAsyncSection(
        TRACE_TAG_REACT_APPS,
        profileNameString,
        cookie,
      );
    }
  },

  /**
   * counterEvent registers the value to the profileName on the systrace timeline
   **/
  counterEvent(profileName?: string | (() => string), value?: number) {
    if (_enabled) {
      const profileNameString =
        typeof profileName === 'function' ? profileName() : profileName;
      global.nativeTraceCounter &&
        global.nativeTraceCounter(
          TRACE_TAG_REACT_APPS,
          profileNameString,
          value,
        );
    }
  },
};

if (__DEV__) {
  // This is needed, because require callis in polyfills are not processed as
  // other files. Therefore, calls to `require('moduleId')` are not replaced
  // with numeric IDs
  // TODO(davidaurelio) Scan polyfills for dependencies, too (t9759686)
  (require: $FlowFixMe).Systrace = Systrace;
}

module.exports = Systrace;
