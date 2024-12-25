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
  enableNetworkInspector: boolean,
}>;

export type ExperimentsConfig = Partial<Experiments>;
