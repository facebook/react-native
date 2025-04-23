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

import type TerminalReporter from 'metro/src/lib/TerminalReporter';

type LoggerFn = (...message: $ReadOnlyArray<string>) => void;

/**
 * Create a dev-middleware logger object that will emit logs via Metro's
 * terminal reporter.
 */
export default function createDevMiddlewareLogger(
  reporter: TerminalReporter,
): $ReadOnly<{
  info: LoggerFn,
  error: LoggerFn,
  warn: LoggerFn,
}> {
  return {
    info: makeLogger(reporter, 'info'),
    warn: makeLogger(reporter, 'warn'),
    error: makeLogger(reporter, 'error'),
  };
}

function makeLogger(
  reporter: TerminalReporter,
  level: 'info' | 'warn' | 'error',
): LoggerFn {
  return (...data: Array<mixed>) =>
    reporter.update({
      type: 'unstable_server_log',
      level,
      data,
    });
}
