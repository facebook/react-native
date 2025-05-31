/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export type Experiments = $ReadOnly<{
  /**
   * Enables the handling of GET requests in the /open-debugger endpoint,
   * in addition to POST requests. GET requests respond by redirecting to
   * the debugger frontend, instead of opening it using the BrowserLauncher
   * interface.
   */
  enableOpenDebuggerRedirect: boolean,

  /**
   * Enables the Network panel in the debugger frontend.
   */
  // NOTE: Used by Expo, exposing a tab labelled "Network (Expo, unstable)"
  enableNetworkInspector: boolean,

  /**
   * Launch the Fusebox frontend in a standalone shell instead of a browser.
   * When this is enabled, we will use the optional unstable_showFuseboxShell
   * method on the framework-provided BrowserLauncher, or throw an error if the
   * method is missing. Note that the default BrowserLauncher does *not*
   * implement unstable_showFuseboxShell.
   */
  enableStandaloneFuseboxShell: boolean,
}>;

export type ExperimentsConfig = Partial<Experiments>;
