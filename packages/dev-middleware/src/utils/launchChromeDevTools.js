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

import type {LaunchedChrome} from 'chrome-launcher';

import launchDebuggerAppWindow from './launchDebuggerAppWindow';

/**
 * The Chrome DevTools frontend revision to use. This should be set to the
 * latest version known to be compatible with Hermes.
 *
 * Revision should be the full identifier from:
 * https://chromium.googlesource.com/chromium/src.git
 */
const DEVTOOLS_FRONTEND_REV = 'd9568d04d7dd79269c5a655d7ada69650c5a8336'; // Chrome 100.0.4896.75

/**
 * Attempt to launch Chrome DevTools on the host machine for a given CDP target.
 */
export default async function launchChromeDevTools(
  webSocketDebuggerUrl: string,
): Promise<LaunchedChrome> {
  const urlBase = `https://chrome-devtools-frontend.appspot.com/serve_rev/@${DEVTOOLS_FRONTEND_REV}/devtools_app.html`;
  const ws = webSocketDebuggerUrl.replace(/^ws:\/\//, '');

  return launchDebuggerAppWindow(
    `${urlBase}?panel=console&ws=${encodeURIComponent(ws)}`,
    'open-debugger',
  );
}
