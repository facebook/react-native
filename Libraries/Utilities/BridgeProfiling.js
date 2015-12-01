/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BridgeProfiling
 * @flow
 */
'use strict';

type RelayProfiler = {
  attachProfileHandler(
    name: string,
    handler: (name: string, state?: any) => () => void
  ): void
};

var GLOBAL = GLOBAL || this;
var TRACE_TAG_REACT_APPS = 1 << 17;

var _enabled;
var _asyncCookie = 0;
var _ReactPerf = null;
function ReactPerf() {
  if (!_ReactPerf) {
    _ReactPerf = require('ReactPerf');
  }
  return _ReactPerf;
}

var BridgeProfiling = {
  setEnabled(enabled: boolean) {
    _enabled = enabled;

    ReactPerf().enableMeasure = enabled;
  },

  /**
   * profile/profileEnd for starting and then ending a profile within the same call stack frame
  **/
  profile(profileName?: any) {
    if (_enabled) {
      profileName = typeof profileName === 'function' ?
        profileName() : profileName;
      global.nativeTraceBeginSection(TRACE_TAG_REACT_APPS, profileName);
    }
  },

  profileEnd() {
    if (_enabled) {
      global.nativeTraceEndSection(TRACE_TAG_REACT_APPS);
    }
  },

  /**
   * profileAsync/profileAsyncEnd for starting and then ending a profile where the end can either
   * occur on another thread or out of the current stack frame, eg await
   * the returned cookie variable should be used as input into the asyncEnd call to end the profile
  **/
  profileAsync(profileName?: any): any {
    var cookie = _asyncCookie;
    if (_enabled) {
      _asyncCookie++;
      profileName = typeof profileName === 'function' ?
        profileName() : profileName;
      global.nativeTraceBeginAsyncSection(TRACE_TAG_REACT_APPS, profileName, cookie, 0);
    }
    return cookie;
  },

  profileAsyncEnd(profileName?: any, cookie?: any) {
    if (_enabled) {
      profileName = typeof profileName === 'function' ?
        profileName() : profileName;
      global.nativeTraceEndAsyncSection(TRACE_TAG_REACT_APPS, profileName, cookie, 0);
    }
  },

  reactPerfMeasure(objName: string, fnName: string, func: any): any {
    return function (component) {
      if (!_enabled) {
        return func.apply(this, arguments);
      }

      var name = objName === 'ReactCompositeComponent' && this.getName() || '';
      BridgeProfiling.profile(`${objName}.${fnName}(${name})`);
    var ret = func.apply(this, arguments);
      BridgeProfiling.profileEnd();
      return ret;
    };
  },

  swizzleReactPerf() {
    ReactPerf().injection.injectMeasure(BridgeProfiling.reactPerfMeasure);
  },

  /**
   * Relay profiles use await calls, so likely occur out of current stack frame
   * therefore async variant of profiling is used
  **/
  attachToRelayProfiler(relayProfiler: RelayProfiler) {
    relayProfiler.attachProfileHandler('*', (name) => {
      var cookie = BridgeProfiling.profileAsync(name);
      return () => {
        BridgeProfiling.profileAsyncEnd(name, cookie);
      };
    });
  },

  /* This is not called by default due to perf overhead but it's useful
     if you want to find traces which spend too much time in JSON. */
  swizzleJSON() {
    BridgeProfiling.measureMethods(JSON, 'JSON', [
      'parse',
      'stringify'
    ]);
  },

 /**
  * Measures multiple methods of a class. For example, you can do:
  * BridgeProfiling.measureMethods(JSON, 'JSON', ['parse', 'stringify']);
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
     object[methodName] = BridgeProfiling.measure(
       objectName,
       methodName,
       object[methodName]
     );
   });
 },

 /**
  * Returns an profiled version of the input function. For example, you can:
  * JSON.parse = BridgeProfiling.measure('JSON', 'parse', JSON.parse);
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

   var profileName = `${objName}.${fnName}`;
   return function() {
     if (!_enabled) {
       return func.apply(this, arguments);
     }

     BridgeProfiling.profile(profileName);
     var ret = func.apply(this, arguments);
     BridgeProfiling.profileEnd();
     return ret;
   };
 },
};

BridgeProfiling.setEnabled(global.__RCTProfileIsProfiling || false);

module.exports = BridgeProfiling;
