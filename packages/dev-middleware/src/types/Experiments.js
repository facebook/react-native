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
   * Enables the new JS debugger launch flow and custom debugger frontend
   * (@react-native/debugger-frontend). When disabled, /open-debugger will
   * trigger the legacy Flipper connection flow.
   */
  enableNewDebugger: boolean,

  /**
   * Enables the handling of GET requests in the /open-debugger endpoint,
   * in addition to POST requests. GET requests respond by redirecting to
   * the debugger frontend, instead of opening it using the BrowserLauncher
   * interface.
   */
  enableOpenDebuggerRedirect: boolean,

  /**
   * Enables the Network panel when launching the custom debugger frontend.
   */
  enableNetworkInspector: boolean,

  /**
   * [Meta-internal] Controls visibility of the internal "Fusebox" codename
   * across the UI when using the modern `rn_fusebox` entry point.
   */
  useFuseboxInternalBranding: boolean,
}>;

export type ExperimentsConfig = Partial<Experiments>;
