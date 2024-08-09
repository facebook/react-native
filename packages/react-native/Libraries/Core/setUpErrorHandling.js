/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * Sets up the console and exception handling (redbox) for React Native.
 * You can use this module directly, or just require InitializeCore.
 */
const ExceptionsManager = require('./ExceptionsManager');
ExceptionsManager.installConsoleErrorReporter();

// Set up error handler
if (!global.__fbDisableExceptionsManager) {
  const handleError = (e: mixed, isFatal: boolean) => {
    try {
      // TODO(T196834299): We should really use a c++ turbomodule for this
      if (
        global.RN$handleFatalError &&
        global.RN$isJSPipelineEnabled &&
        global.RN$notifyOfFatalError
      ) {
        if (global.RN$isJSPipelineEnabled()) {
          if (isFatal) {
            global.RN$notifyOfFatalError();
          }
          ExceptionsManager.handleException(e, isFatal);
        } else {
          if (isFatal) {
            global.RN$handleFatalError(e);
          } else {
            // Two things are possible:
            // 1. We haven't yet finished executing the js bundle
            // 2. We finished executing the js bundle, but the js bundle fataled.
            // In either case, just call into the js pipeline and hope for the best.
            ExceptionsManager.handleException(e, false);
          }
        }
      } else {
        ExceptionsManager.handleException(e, isFatal);
      }
    } catch (ee) {
      console.log('Failed to print error: ', ee.message);
      throw e;
    }
  };

  const ErrorUtils = require('../vendor/core/ErrorUtils');
  ErrorUtils.setGlobalHandler(handleError);
}
