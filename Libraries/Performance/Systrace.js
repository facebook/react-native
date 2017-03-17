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

const invariant = require('invariant');

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
const TRACE_TAG_JSC_CALLS = 1 << 27;

let _enabled = false;
let _asyncCookie = 0;

let _markStack = [];
let _markStackIndex = -1;

const userTimingPolyfill = {
  mark(markName : string) {
    if (__DEV__) {
      if (_enabled) {
        _markStackIndex++;
        _markStack[_markStackIndex] = markName;
        let label = markName;
        if (markName[0] === '\u269B') {
          // This is coming from React.
          // Remove emoji and component IDs.
          const indexOfId = markName.lastIndexOf(' (#');
          const cutoffIndex = indexOfId !== -1 ? indexOfId : markName.length;
          label = markName.slice(2, cutoffIndex);
        }
        Systrace.beginEvent(label);
      }
    }
  },
  measure(label : string, markName : string) {
    if (__DEV__) {
      if (_enabled) {
        invariant(markName === _markStack[_markStackIndex], 'Unexpected measure() call.');
        // TODO: it would be nice to use `label` because it is more friendly.
        // I don't know if there's a way to annotate measurements post factum.
        _markStackIndex--;
        Systrace.endEvent();
      }
    }
  },
  clearMarks(markName : string) {
    if (__DEV__) {
      if (_enabled) {
        if (_markStackIndex > -1 && markName === _markStack[_markStackIndex]) {
          _markStackIndex--;
          // TODO: ideally this event shouldn't show up in the first place.
          // I don't know if there's a way to cancel an ongoing measurement.
          Systrace.endEvent();
        }
      }
    }
  },
  clearMeasures() {
    // Noop.
  },
};

const Systrace = {
  getUserTimingPolyfill() {
    return userTimingPolyfill;
  },

  setEnabled(enabled: boolean) {
    if (_enabled !== enabled) {
      if (__DEV__) {
        if (enabled) {
          global.nativeTraceBeginLegacy && global.nativeTraceBeginLegacy(TRACE_TAG_JSC_CALLS);
        } else {
          global.nativeTraceEndLegacy && global.nativeTraceEndLegacy(TRACE_TAG_JSC_CALLS);
        }
      }
      _enabled = enabled;
    }
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
      global.nativeTraceBeginAsyncSection(TRACE_TAG_REACT_APPS, profileName, cookie, 0);
    }
    return cookie;
  },

  endAsyncEvent(profileName?: any, cookie?: any) {
    if (_enabled) {
      profileName = typeof profileName === 'function' ?
        profileName() : profileName;
      global.nativeTraceEndAsyncSection(TRACE_TAG_REACT_APPS, profileName, cookie, 0);
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
    relayProfiler.attachProfileHandler('*', (name) => {
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
