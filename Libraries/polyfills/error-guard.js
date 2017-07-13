/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @polyfill
 */

/* eslint-disable strict */

let _inGuard = 0;

/**
 * This is the error handler that is called when we encounter an exception
 * when loading a module. This will report any errors encountered before
 * ExceptionsManager is configured.
 */
let _globalHandler = function onError(e) {
  throw e;
};

/**
 * The particular require runtime that we are using looks for a global
 * `ErrorUtils` object and if it exists, then it requires modules with the
 * error handler specified via ErrorUtils.setGlobalHandler by calling the
 * require function with applyWithGuard. Since the require module is loaded
 * before any of the modules, this ErrorUtils must be defined (and the handler
 * set) globally before requiring anything.
 */
const ErrorUtils = {
  setGlobalHandler(fun) {
    _globalHandler = fun;
  },
  getGlobalHandler() {
    return _globalHandler;
  },
  reportError(error) {
    _globalHandler && _globalHandler(error);
  },
  reportFatalError(error) {
    _globalHandler && _globalHandler(error, true);
  },
  applyWithGuard(fun, context, args) {
    try {
      _inGuard++;
      return fun.apply(context, args);
    } catch (e) {
      ErrorUtils.reportError(e);
    } finally {
      _inGuard--;
    }
    return null;
  },
  applyWithGuardIfNeeded(fun, context, args) {
    if (ErrorUtils.inGuard()) {
      return fun.apply(context, args);
    } else {
      ErrorUtils.applyWithGuard(fun, context, args);
    }
    return null;
  },
  inGuard() {
    return _inGuard;
  },
  guard(fun, name, context) {
    if (typeof fun !== 'function') {
      console.warn('A function must be passed to ErrorUtils.guard, got ', fun);
      return null;
    }
    name = name || fun.name || '<generated guard>';
    function guarded() {
      return (
        ErrorUtils.applyWithGuard(
          fun,
          context || this,
          arguments,
          null,
          name
        )
      );
    }

    return guarded;
  },
};

global.ErrorUtils = ErrorUtils;
