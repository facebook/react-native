/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Systrace
 * @flow
 */
'use strict';

const invariant = require('fbjs/lib/invariant');

type RelayProfiler = {
  attachProfileHandler(
    name: string,
    handler: (name: string, state?: any) => () => void
  ): void,

  attachAggregateHandler(
    name: string,
    handler: (name: string, callback: () => void) => void
  ): void,
};

/* eslint no-bitwise: 0 */
const TRACE_TAG_REACT_APPS = 1 << 17;
const TRACE_TAG_JS_VM_CALLS = 1 << 27;

let _enabled = false;
let _asyncCookie = 0;
const _markStack = [];
let _markStackIndex = -1;
let _canInstallReactHook = false;
let _useFiber = false;

// Implements a subset of User Timing API necessary for React measurements.
// https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API
const REACT_MARKER = '\u269B';
const userTimingPolyfill = __DEV__ ? {
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
        'Only performance.measure(string, string) overload is supported.'
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
} : null;

// A hook to get React Stack markers in Systrace.
const reactDebugToolHook = __DEV__ ? {
  onBeforeMountComponent(debugID) {
    const ReactComponentTreeHook = require('ReactGlobalSharedState').ReactComponentTreeHook;
    const displayName = ReactComponentTreeHook.getDisplayName(debugID);
    Systrace.beginEvent(`ReactReconciler.mountComponent(${displayName})`);
  },
  onMountComponent(debugID) {
    Systrace.endEvent();
  },
  onBeforeUpdateComponent(debugID) {
    const ReactComponentTreeHook = require('ReactGlobalSharedState').ReactComponentTreeHook;
    const displayName = ReactComponentTreeHook.getDisplayName(debugID);
    Systrace.beginEvent(`ReactReconciler.updateComponent(${displayName})`);
  },
  onUpdateComponent(debugID) {
    Systrace.endEvent();
  },
  onBeforeUnmountComponent(debugID) {
    const ReactComponentTreeHook = require('ReactGlobalSharedState').ReactComponentTreeHook;
    const displayName = ReactComponentTreeHook.getDisplayName(debugID);
    Systrace.beginEvent(`ReactReconciler.unmountComponent(${displayName})`);
  },
  onUnmountComponent(debugID) {
    Systrace.endEvent();
  },
  onBeginLifeCycleTimer(debugID, timerType) {
    const ReactComponentTreeHook = require('ReactGlobalSharedState').ReactComponentTreeHook;
    const displayName = ReactComponentTreeHook.getDisplayName(debugID);
    Systrace.beginEvent(`${displayName}.${timerType}()`);
  },
  onEndLifeCycleTimer(debugID, timerType) {
    Systrace.endEvent();
  },
} : null;

const Systrace = {
  installReactHook(useFiber: boolean) {
    if (_enabled) {
      if (__DEV__) {
        if (useFiber) {
          global.performance = userTimingPolyfill;
        } else {
          require('ReactDebugTool').addHook(reactDebugToolHook);
        }
      }
    }
    _useFiber = useFiber;
    _canInstallReactHook = true;
  },

  setEnabled(enabled: boolean) {
    if (_enabled !== enabled) {
      if (__DEV__) {
        if (enabled) {
          global.nativeTraceBeginLegacy && global.nativeTraceBeginLegacy(TRACE_TAG_JS_VM_CALLS);
        } else {
          global.nativeTraceEndLegacy && global.nativeTraceEndLegacy(TRACE_TAG_JS_VM_CALLS);
        }
        if (_canInstallReactHook) {
          if (_useFiber) {
            if (enabled && global.performance === undefined) {
              global.performance = userTimingPolyfill;
            }
          } else {
            const ReactDebugTool = require('ReactDebugTool');
            if (enabled) {
              ReactDebugTool.addHook(reactDebugToolHook);
            } else {
              ReactDebugTool.removeHook(reactDebugToolHook);
            }
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
  beginEvent(profileName?: any, args?: any) {
    if (_enabled) {
      profileName = typeof profileName === 'function' ?
        profileName() : profileName;
      global.nativeTraceBeginSection(TRACE_TAG_REACT_APPS, profileName, args);
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
  beginAsyncEvent(profileName?: any): any {
    const cookie = _asyncCookie;
    if (_enabled) {
      _asyncCookie++;
      profileName = typeof profileName === 'function' ?
        profileName() : profileName;
      global.nativeTraceBeginAsyncSection(TRACE_TAG_REACT_APPS, profileName, cookie);
    }
    return cookie;
  },

  endAsyncEvent(profileName?: any, cookie?: any) {
    if (_enabled) {
      profileName = typeof profileName === 'function' ?
        profileName() : profileName;
      global.nativeTraceEndAsyncSection(TRACE_TAG_REACT_APPS, profileName, cookie);
    }
  },

  /**
   * counterEvent registers the value to the profileName on the systrace timeline
  **/
  counterEvent(profileName?: any, value?: any) {
    if (_enabled) {
      profileName = typeof profileName === 'function' ?
        profileName() : profileName;
      global.nativeTraceCounter &&
        global.nativeTraceCounter(TRACE_TAG_REACT_APPS, profileName, value);
    }
  },

  /**
   * Relay profiles use await calls, so likely occur out of current stack frame
   * therefore async variant of profiling is used
  **/
  attachToRelayProfiler(relayProfiler: RelayProfiler) {
    relayProfiler.attachProfileHandler('*', (name, state?) => {
      if (state != null && state.queryName !== undefined) {
        name += '_' + state.queryName
      }
      const cookie = Systrace.beginAsyncEvent(name);
      return () => {
        Systrace.endAsyncEvent(name, cookie);
      };
    });

    relayProfiler.attachAggregateHandler('*', (name, callback) => {
      Systrace.beginEvent(name);
      callback();
      Systrace.endEvent();
    });
  },

  /* This is not called by default due to perf overhead but it's useful
     if you want to find traces which spend too much time in JSON. */
  swizzleJSON() {
    Systrace.measureMethods(JSON, 'JSON', [
      'parse',
      'stringify'
    ]);
  },

 /**
  * Measures multiple methods of a class. For example, you can do:
  * Systrace.measureMethods(JSON, 'JSON', ['parse', 'stringify']);
  *
  * @param object
  * @param objectName
  * @param methodNames Map from method names to method display names.
  */
 measureMethods(object: any, objectName: string, methodNames: Array<string>): void {
   if (!__DEV__) {
     return;
   }

   methodNames.forEach(methodName => {
     object[methodName] = Systrace.measure(
       objectName,
       methodName,
       object[methodName]
     );
   });
 },

 /**
  * Returns an profiled version of the input function. For example, you can:
  * JSON.parse = Systrace.measure('JSON', 'parse', JSON.parse);
  *
  * @param objName
  * @param fnName
  * @param {function} func
  * @return {function} replacement function
  */
 measure(objName: string, fnName: string, func: any): any {
   if (!__DEV__) {
     return func;
   }

   const profileName = `${objName}.${fnName}`;
   return function() {
     if (!_enabled) {
       return func.apply(this, arguments);
     }

     Systrace.beginEvent(profileName);
     const ret = func.apply(this, arguments);
     Systrace.endEvent();
     return ret;
   };
 },
};

if (__DEV__) {
  // This is needed, because require callis in polyfills are not processed as
  // other files. Therefore, calls to `require('moduleId')` are not replaced
  // with numeric IDs
  // TODO(davidaurelio) Scan polyfills for dependencies, too (t9759686)
  (require: any).Systrace = Systrace;
}

module.exports = Systrace;
