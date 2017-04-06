/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const chalk = require('chalk');
const util = require('util');

import type {Terminal} from './terminal';

export type GlobalCacheDisabledReason = 'too_many_errors' | 'too_many_misses';

/**
 * A tagged union of all the actions that may happen and we may want to
 * report to the tool user.
 */
export type ReportableEvent = {
  port: number,
  projectRoots: Array<string>,
  type: 'initialize_packager_started',
} | {
  type: 'initialize_packager_done',
} | {
  type: 'initialize_packager_failed',
  port: number,
  error: Error,
} | {
  entryFilePath: string,
  type: 'bundle_build_done',
} | {
  entryFilePath: string,
  error: Error,
  type: 'bundle_build_failed',
} | {
  entryFilePath: string,
  type: 'bundle_build_started',
} | {
  type: 'dep_graph_loading',
} | {
  type: 'dep_graph_loaded',
} | {
  type: 'bundle_transform_progressed',
  entryFilePath: string,
  transformedFileCount: number,
  totalFileCount: number,
} | {
  type: 'global_cache_error',
  error: Error,
} | {
  type: 'global_cache_disabled',
  reason: GlobalCacheDisabledReason,
} | {
  type: 'transform_cache_reset',
};

/**
 * Code across the application takes a reporter as an option and calls the
 * update whenever one of the ReportableEvent happens. Code does not directly
 * write to the standard output, because a build would be:
 *
 *   1. ad-hoc, embedded into another tool, in which case we do not want to
 *   pollute that tool's own output. The tool is free to present the
 *   warnings/progress we generate any way they want, by specifing a custom
 *   reporter.
 *   2. run as a background process from another tool, in which case we want
 *   to expose updates in a way that is easily machine-readable, for example
 *   a JSON-stream. We don't want to pollute it with textual messages.
 *
 * We centralize terminal reporting into a single place because we want the
 * output to be robust and consistent. The most common reporter is
 * TerminalReporter, that should be the only place in the application should
 * access the `terminal` module (nor the `console`).
 */
export type Reporter = {
  update(event: ReportableEvent): void,
};

/**
 * A standard way to log a warning to the terminal. This should not be called
 * from some arbitrary packager logic, only from the reporters. Instead of
 * calling this, add a new type of ReportableEvent instead, and implement a
 * proper handler in the reporter(s).
 */
function logWarning(terminal: Terminal, format: string, ...args: Array<mixed>): void {
  const str = util.format(format, ...args);
  terminal.log('%s: %s', chalk.yellow('warning'), str);
}

/**
 * Similar to `logWarning`, but for messages that require the user to act.
 */
function logError(terminal: Terminal, format: string, ...args: Array<mixed>): void {
  const str = util.format(format, ...args);
  terminal.log('%s: %s', chalk.red('error'), str);
}

/**
 * A reporter that does nothing. Errors and warnings will be swallowed, that
 * is generally not what you want.
 */
const nullReporter = {update() {}};

module.exports = {
  logWarning,
  logError,
  nullReporter,
};
