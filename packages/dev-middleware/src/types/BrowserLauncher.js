/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

/**
 * An interface for integrators to provide a custom implementation for
 * opening URLs in a web browser.
 */
export interface BrowserLauncher {
  /**
   * Attempt to open a debugger frontend URL in a browser app window,
   * optionally returning an object to control the launched browser instance.
   * The browser used should be capable of running Chrome DevTools.
   *
   * The provided url is based on serverBaseUrl, and therefore reachable from
   * the host of dev-middleware. Implementations are responsible for rewriting
   * this as necessary where the server is remote.
   */
  launchDebuggerAppWindow: (url: string) => Promise<void>;
}
