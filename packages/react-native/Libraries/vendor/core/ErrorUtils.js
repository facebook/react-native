/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// From @react-native/js-polyfills
type ErrorHandler = (error: mixed, isFatal: boolean) => void;
type Fn<Args: $ReadOnlyArray<mixed>, Return> = (...Args) => Return;
export type ErrorUtils = {
  applyWithGuard<TArgs: $ReadOnlyArray<mixed>, TOut>(
    fun: Fn<TArgs, TOut>,
    context?: mixed,
    args?: ?TArgs,
    unused_onError?: null,
    unused_name?: ?string,
  ): ?TOut,
  applyWithGuardIfNeeded<TArgs: $ReadOnlyArray<mixed>, TOut>(
    fun: Fn<TArgs, TOut>,
    context?: mixed,
    args?: ?TArgs,
  ): ?TOut,
  getGlobalHandler(): ErrorHandler,
  guard<TArgs: $ReadOnlyArray<mixed>, TOut>(
    fun: Fn<TArgs, TOut>,
    name?: ?string,
    context?: mixed,
  ): ?(...TArgs) => ?TOut,
  inGuard(): boolean,
  reportError(error: mixed): void,
  reportFatalError(error: mixed): void,
  setGlobalHandler(fun: ErrorHandler): void,
};

/**
 * The particular require runtime that we are using looks for a global
 * `ErrorUtils` object and if it exists, then it requires modules with the
 * error handler specified via ErrorUtils.setGlobalHandler by calling the
 * require function with applyWithGuard. Since the require module is loaded
 * before any of the modules, this ErrorUtils must be defined (and the handler
 * set) globally before requiring anything.
 *
 * However, we still want to treat ErrorUtils as a module so that other modules
 * that use it aren't just using a global variable, so simply export the global
 * variable here. ErrorUtils is originally defined in a file named error-guard.js.
 */
export default global.ErrorUtils as ErrorUtils;
