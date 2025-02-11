/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

// Determine the base URL (scheme and host) used by a client to reach this
// server.
//
// TODO: Support X-Forwarded-Host, etc. for trusted proxies
export default function getBaseUrlFromRequest(
  req: http$IncomingMessage<tls$TLSSocket> | http$IncomingMessage<net$Socket>,
): ?URL {
  const hostHeader = req.headers.host;
  if (hostHeader == null) {
    return null;
  }
  // `encrypted` is always true for TLS sockets and undefined for net
  // https://github.com/nodejs/node/issues/41863#issuecomment-1030709186
  const scheme = req.socket.encrypted === true ? 'https' : 'http';
  const url = `${scheme}://${req.headers.host}`;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}
