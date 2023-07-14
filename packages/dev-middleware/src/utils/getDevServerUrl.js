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

import net from 'net';
import {TLSSocket} from 'tls';

/**
 * Get the base URL to address the current development server.
 */
export default function getDevServerUrl(req: IncomingMessage): string {
  const scheme =
    req.socket instanceof TLSSocket && req.socket.encrypted === true
      ? 'https'
      : 'http';
  const {localAddress, localPort} = req.socket;
  const address =
    localAddress && net.isIPv6(localAddress)
      ? `[${localAddress}]`
      : localAddress;

  return `${scheme}:${address}:${localPort}`;
}
