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
const formatBanner = require('./formatBanner');
const path = require('path');
const reporting = require('./reporting');
const throttle = require('lodash/throttle');
const util = require('util');

import type Terminal from './TerminalClass';
import type {ReportableEvent, GlobalCacheDisabledReason} from './reporting';

const DEP_GRAPH_MESSAGE = 'Loading dependency graph';
const GLOBAL_CACHE_DISABLED_MESSAGE_FORMAT =
  'The global cache is now disabled because %s';

type BundleProgress = {
  entryFilePath: string,
  transformedFileCount: number,
  totalFileCount: number,
  ratio: number,
};

const DARK_BLOCK_CHAR = '\u2593';
const LIGHT_BLOCK_CHAR = '\u2591';

function getProgressBar(ratio: number, length: number) {
  const blockCount = Math.floor(ratio * length);
  return (
    DARK_BLOCK_CHAR.repeat(blockCount) +
    LIGHT_BLOCK_CHAR.repeat(length - blockCount)
  );
}

export type TerminalReportableEvent = ReportableEvent | {
  buildID: string,
  type: 'bundle_transform_progressed_throttled',
  transformedFileCount: number,
  totalFileCount: number,
};

type BuildPhase = 'in_progress' | 'done' | 'failed';

/**
 * We try to print useful information to the terminal for interactive builds.
 * This implements the `Reporter` interface from the './reporting' module.
 */
class TerminalReporter {

  /**
   * The bundle builds for which we are actively maintaining the status on the
   * terminal, ie. showing a progress bar. There can be several bundles being
   * built at the same time.
   */
  _activeBundles: Map<string, BundleProgress>;

  _dependencyGraphHasLoaded: boolean;
  _scheduleUpdateBundleProgress: (data: {
    buildID: string,
    transformedFileCount: number,
    totalFileCount: number,
  }) => void;

  +terminal: Terminal;

  constructor(terminal: Terminal) {
    this._dependencyGraphHasLoaded = false;
    this._activeBundles = new Map();
    this._scheduleUpdateBundleProgress = throttle(data => {
      this.update({...data, type: 'bundle_transform_progressed_throttled'});
    }, 100);
    (this: any).terminal = terminal;
  }

  /**
   * Construct a message that represents the progress of a
   * single bundle build, for example:
   *
   *     Bunding `foo.js`  |####         | 34.2% (324/945)
   */
  _getBundleStatusMessage(
    {entryFilePath, totalFileCount, transformedFileCount, ratio}: BundleProgress,
    phase: BuildPhase,
  ): string {
    const localPath = path.relative('.', entryFilePath);
    return util.format(
      'Bundling `%s`  %s%s% (%s/%s)%s',
      localPath,
      phase === 'in_progress' ? getProgressBar(ratio, 16) + '  ' : '',
      (100 * ratio).toFixed(1),
      transformedFileCount,
      totalFileCount,
      phase === 'done' ? ', done.' : (phase === 'failed' ? ', failed.' : ''),
    );
  }

  _logCacheDisabled(reason: GlobalCacheDisabledReason): void {
    const format = GLOBAL_CACHE_DISABLED_MESSAGE_FORMAT;
    switch (reason) {
      case 'too_many_errors':
        reporting.logWarning(
          this.terminal,
          format,
          'it has been failing too many times.',
        );
        break;
      case 'too_many_misses':
        reporting.logWarning(
          this.terminal,
          format,
          'it has been missing too many consecutive keys.',
        );
        break;
    }
  }

  _logBundleBuildDone(buildID: string) {
    const progress = this._activeBundles.get(buildID);
    if (progress != null) {
      const msg = this._getBundleStatusMessage({
        ...progress,
        ratio: 1,
        transformedFileCount: progress.totalFileCount,
      }, 'done');
      this.terminal.log(msg);
    }
  }

  _logBundleBuildFailed(buildID: string) {
    const progress = this._activeBundles.get(buildID);
    if (progress != null) {
      const msg = this._getBundleStatusMessage(progress, 'failed');
      this.terminal.log(msg);
    }
  }

  _logPackagerInitializing(port: number, projectRoots: $ReadOnlyArray<string>) {
    this.terminal.log(
      formatBanner(
        'Running packager on port ' +
          port +
          '.\n\n' +
          'Keep this packager running while developing on any JS projects. ' +
          'Feel free to close this tab and run your own packager instance if you ' +
          'prefer.\n\n' +
          'https://github.com/facebook/react-native',
        {
          marginLeft: 1,
          marginRight: 1,
          paddingBottom: 1,
        }
      )
    );

    this.terminal.log(
      'Looking for JS files in\n  ',
      chalk.dim(projectRoots.join('\n   ')),
      '\n'
    );
  }

  _logPackagerInitializingFailed(port: number, error: Error) {
    if (error.code === 'EADDRINUSE') {
      this.terminal.log(
        chalk.bgRed.bold(' ERROR '),
        chalk.red("Packager can't listen on port", chalk.bold(port))
      );
      this.terminal.log('Most likely another process is already using this port');
      this.terminal.log('Run the following command to find out which process:');
      this.terminal.log('\n  ', chalk.bold('lsof -i :' + port), '\n');
      this.terminal.log('Then, you can either shut down the other process:');
      this.terminal.log('\n  ', chalk.bold('kill -9 <PID>'), '\n');
      this.terminal.log('or run packager on different port.');
    } else {
      this.terminal.log(chalk.bgRed.bold(' ERROR '), chalk.red(error.message));
      const errorAttributes = JSON.stringify(error);
      if (errorAttributes !== '{}') {
        this.terminal.log(chalk.red(errorAttributes));
      }
      this.terminal.log(chalk.red(error.stack));
    }
  }

  /**
   * This function is only concerned with logging and should not do state
   * or terminal status updates.
   */
  _log(event: TerminalReportableEvent): void {
    switch (event.type) {
      case 'initialize_packager_started':
        this._logPackagerInitializing(event.port, event.projectRoots);
        break;
      case 'initialize_packager_done':
        this.terminal.log('\nReact packager ready.\n');
        break;
      case 'initialize_packager_failed':
        this._logPackagerInitializingFailed(event.port, event.error);
        break;
      case 'bundle_build_done':
        this._logBundleBuildDone(event.buildID);
        break;
      case 'bundle_build_failed':
        this._logBundleBuildFailed(event.buildID);
        break;
      case 'bundling_error':
        this._logBundlingError(event.error);
        break;
      case 'dep_graph_loaded':
        this.terminal.log(`${DEP_GRAPH_MESSAGE}, done.`);
        break;
      case 'global_cache_disabled':
        this._logCacheDisabled(event.reason);
        break;
      case 'transform_cache_reset':
        reporting.logWarning(this.terminal, 'the transform cache was reset.');
        break;
      case 'worker_stdout_chunk':
        this._logWorkerChunk('stdout', event.chunk);
        break;
      case 'worker_stderr_chunk':
        this._logWorkerChunk('stderr', event.chunk);
        break;
    }
  }

  /**
   * We do not want to log the whole stacktrace for bundling error, because
   * these are operational errors, not programming errors, and the stacktrace
   * is not actionable to end users.
   */
  _logBundlingError(error: Error) {
    const str = JSON.stringify(error.message);
    reporting.logError(this.terminal, 'bundling failed: %s', str);
  }

  _logWorkerChunk(origin: 'stdout' | 'stderr', chunk: string) {
    const lines = chunk.split('\n');
    if (lines.length >= 1 && lines[lines.length - 1] === '') {
      lines.splice(lines.length - 1, 1);
    }
    lines.forEach(line => {
      this.terminal.log(`transform[${origin}]: ${line}`);
    });
  }

  /**
   * We use Math.pow(ratio, 2) to as a conservative measure of progress because
   * we know the `totalCount` is going to progressively increase as well. We
   * also prevent the ratio from going backwards.
   */
  _updateBundleProgress(
    {buildID, transformedFileCount, totalFileCount}: {
      buildID: string,
      transformedFileCount: number,
      totalFileCount: number,
    },
  ) {
    const currentProgress = this._activeBundles.get(buildID);
    if (currentProgress == null) {
      return;
    }
    const rawRatio = transformedFileCount / totalFileCount;
    const conservativeRatio = Math.pow(rawRatio, 2);
    const ratio = Math.max(conservativeRatio, currentProgress.ratio);
    Object.assign(currentProgress, {
      ratio,
      transformedFileCount,
      totalFileCount,
    });
  }

  /**
   * This function is exclusively concerned with updating the internal state.
   * No logging or status updates should be done at this point.
   */
  _updateState(event: TerminalReportableEvent): void {
    switch (event.type) {
      case 'bundle_build_done':
      case 'bundle_build_failed':
        this._activeBundles.delete(event.buildID);
        break;
      case 'bundle_build_started':
        this._activeBundles.set(event.buildID, {
          entryFilePath: event.entryFilePath,
          transformedFileCount: 0,
          totalFileCount: 1,
          ratio: 0,
        });
        break;
      case 'bundle_transform_progressed':
        if (event.totalFileCount === event.transformedFileCount) {
          this._scheduleUpdateBundleProgress.cancel();
          this._updateBundleProgress(event);
        } else {
          this._scheduleUpdateBundleProgress(event);
        }
        break;
      case 'bundle_transform_progressed_throttled':
        this._updateBundleProgress(event);
        break;
      case 'dep_graph_loading':
        this._dependencyGraphHasLoaded = false;
        break;
      case 'dep_graph_loaded':
        this._dependencyGraphHasLoaded = true;
        break;
    }
  }

  _getDepGraphStatusMessage(): ?string {
    if (!this._dependencyGraphHasLoaded) {
      return `${DEP_GRAPH_MESSAGE}...`;
    }
    return null;
  }

  /**
   * Return a status message that is always consistent with the current state
   * of the application. Having this single function ensures we don't have
   * different callsites overriding each other status messages.
   */
  _getStatusMessage(): string {
    return [
      this._getDepGraphStatusMessage(),
    ].concat(Array.from(this._activeBundles.entries()).map(
      ([_, progress]) =>
        this._getBundleStatusMessage(progress, 'in_progress'),
    )).filter(str => str != null).join('\n');
  }

  /**
   * Everything that happens goes through the same 3 steps. This makes the
   * output more reliable and consistent, because no matter what additional.
   */
  update(event: TerminalReportableEvent) {
    this._log(event);
    this._updateState(event);
    this.terminal.status(this._getStatusMessage());
  }

}

module.exports = TerminalReporter;
