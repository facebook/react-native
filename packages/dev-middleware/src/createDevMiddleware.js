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

import type {NextHandleFunction} from 'connect';
import type {Logger} from './types/Logger';

import connect from 'connect';
import openDebuggerMiddleware from './middleware/openDebuggerMiddleware';

type Options = $ReadOnly<{
  logger?: Logger,
}>;

export default function createDevMiddleware({logger}: Options = {}): {
  middleware: NextHandleFunction,
} {
  const middleware = connect().use(
    '/open-debugger',
    openDebuggerMiddleware({logger}),
  );

  return {middleware};
}
