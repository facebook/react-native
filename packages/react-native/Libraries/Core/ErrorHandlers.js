/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import type {ExtendedError} from './ExtendedError';

import {SyntheticError, handleException} from './ExceptionsManager';

type ErrorInfo = {
  +componentStack?: ?string,
  // $FlowFixMe[unclear-type] unknown props and state.
  +errorBoundary?: ?React$Component<any, any>,
};

export function onUncaughtError(errorValue: mixed, errorInfo: ErrorInfo): void {
  let error;

  // Typically, `errorValue` should be an error. However, other values such as
  // strings (or even null) are sometimes thrown.
  if (errorValue instanceof Error) {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    error = (errorValue: ExtendedError);
  } else if (typeof errorValue === 'string') {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    error = (new SyntheticError(errorValue): ExtendedError);
  } else {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    error = (new SyntheticError('Unspecified error'): ExtendedError);
  }
  try {
    // $FlowFixMe[incompatible-use] this is in try/catch.
    error.componentStack = errorInfo.componentStack;
    error.isComponentError = true;
  } catch {
    // Ignored.
  }

  // Uncaught errors are fatal.
  handleException(error, true);
}

export function onCaughtError(errorValue: mixed, errorInfo: ErrorInfo): void {
  let error;

  // Typically, `errorValue` should be an error. However, other values such as
  // strings (or even null) are sometimes thrown.
  if (errorValue instanceof Error) {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    error = (errorValue: ExtendedError);
  } else if (typeof errorValue === 'string') {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    error = (new SyntheticError(errorValue): ExtendedError);
  } else {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    error = (new SyntheticError('Unspecified error'): ExtendedError);
  }
  try {
    // $FlowFixMe[incompatible-use] this is in try/catch.
    error.componentStack = errorInfo.componentStack;
    error.isComponentError = true;
  } catch {
    // Ignored.
  }

  // Caught errors are not fatal.
  handleException(error, false);
}

export function onRecoverableError(
  errorValue: mixed,
  errorInfo: ErrorInfo,
): void {
  let error;

  // Typically, `errorValue` should be an error. However, other values such as
  // strings (or even null) are sometimes thrown.
  if (errorValue instanceof Error) {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    error = (errorValue: ExtendedError);
  } else if (typeof errorValue === 'string') {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    error = (new SyntheticError(errorValue): ExtendedError);
  } else {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    error = (new SyntheticError('Unspecified error'): ExtendedError);
  }
  try {
    // $FlowFixMe[incompatible-use] this is in try/catch.
    error.componentStack = errorInfo.componentStack;
    error.isComponentError = true;
  } catch {
    // Ignored.
  }

  // Recoverable errors should only be warnings.
  // This will make it a soft error in LogBox.
  // TODO: improve the logging for recoverable errors in prod.
  console.warn(error);
}
