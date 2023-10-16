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

import type {NextHandleFunction} from 'connect';
import type {IncomingMessage, ServerResponse} from 'http';
import type {Logger} from '../types/Logger';

import open from 'open';

const FLIPPER_SELF_CONNECT_URL =
  'flipper://null/Hermesdebuggerrn?device=React%20Native';

type Options = $ReadOnly<{
  logger?: Logger,
}>;

/**
 * Open the legacy Flipper debugger (Hermes).
 *
 * @deprecated This replicates the pre-0.73 workflow of opening Flipper via the
 * `flipper://` URL scheme, failing if Flipper is not installed locally. This
 * flow will be removed in a future version.
 */
export default function deprecated_openFlipperMiddleware({
  logger,
}: Options): NextHandleFunction {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: Error) => void,
  ) => {
    if (req.method === 'POST') {
      logger?.info('Launching JS debugger...');

      try {
        logger?.warn(
          'Attempting to debug JS in Flipper (deprecated). This requires ' +
            'Flipper to be installed on your system to handle the ' +
            "'flipper://' URL scheme.",
        );
        await open(FLIPPER_SELF_CONNECT_URL);
        res.end();
      } catch (e) {
        logger?.error(
          'Error launching Flipper: ' + e.message ?? 'Unknown error',
        );
        res.writeHead(500);
        res.end();
      }
    }
  };
}
