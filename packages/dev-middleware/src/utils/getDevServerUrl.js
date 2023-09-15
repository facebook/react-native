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

import type {IncomingMessage} from 'http';

import {getProto, getHost} from 'actual-request-url';
import net from 'net';
import {TLSSocket} from 'tls';

/**
 * Get the base URL to address the current development server.
 */
export default function getDevServerUrl(
  /** The current HTTP request. */
  req: IncomingMessage,

  /**
   * 'public' for a URL accessible by the same client that sent the request, or
   * 'local' for for a URL accessible from the machine running the dev server.
   */
  kind: 'public' | 'local',

  /**
   * If 'ws', returns a WebSocket URL corresponding to the current server,
   * with the appropriate scheme (ws or wss) for HTTP / HTTPS connections.
   */
  protocolType: 'http' | 'ws' = 'http',
): string {
  if (kind === 'public') {
    const host = getHost(req);
    if (host != null) {
      let scheme = getProto(req);
      if (protocolType === 'ws') {
        scheme = httpSchemeToWsScheme(scheme);
      }
      return `${scheme}://${host}`;
    }
    // If we can't determine a public URL, fall back to a local URL, which *might* still work.
  }
  let scheme =
    req.socket instanceof TLSSocket && req.socket.encrypted === true
      ? 'https'
      : 'http';
  if (protocolType === 'ws') {
    scheme = httpSchemeToWsScheme(scheme);
  }
  const {localAddress, localPort} = req.socket;
  const address =
    localAddress && net.isIPv6(localAddress)
      ? `[${localAddress}]`
      : localAddress;

  return `${scheme}://${address}:${localPort}`;
}

function httpSchemeToWsScheme(scheme: string) {
  switch (scheme) {
    case 'https':
      return 'wss';
    case 'http':
      return 'ws';
    default:
      throw new Error(`Expected http or https but received ${scheme}`);
  }
}
