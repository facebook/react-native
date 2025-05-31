/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
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
   * The provided URL is based on serverBaseUrl, and therefore reachable from
   * the host of dev-middleware. Implementations are responsible for rewriting
   * this as necessary where the server is remote.
   */
  launchDebuggerAppWindow: (url: string) => Promise<void>;

  /**
   * Attempt to open a debugger frontend URL in a standalone shell window
   * designed specifically for React Native DevTools. The provided windowKey
   * should be used to identify an existing window that can be reused instead
   * of opening a new one.
   *
   * Implementations SHOULD treat an existing session with the same windowKey
   * (as long as it's still connected and healthy) as equaivalent to a new
   * session with the new URL, even if the launch URLs for the two sessions are
   * not identical. Implementations SHOULD NOT unnecessarily close and reopen
   * the connection when reusing a session. Implementations SHOULD process any
   * changed/new parameters in the URL and update the session accordingly (e.g.
   * to preserve telemetry data that may have changed).
   *
   * The provided URL is based on serverBaseUrl, and therefore reachable from
   * the host of dev-middleware. Implementations are responsible for rewriting
   * this as necessary where the server is remote.
   */
  unstable_showFuseboxShell?: (url: string, windowKey: string) => Promise<void>;
}
