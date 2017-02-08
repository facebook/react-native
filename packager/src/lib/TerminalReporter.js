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

const path = require('path');
const reporting = require('./reporting');
const terminal = require('./terminal');
const throttle = require('lodash/throttle');
const util = require('util');

import type {ReportableEvent, GlobalCacheDisabledReason} from './reporting';

const DEP_GRAPH_MESSAGE = 'Loading dependency graph';
const GLOBAL_CACHE_DISABLED_MESSAGE_FORMAT =
  'The global cache is now disabled because %s';

type BundleProgress = {
  transformedFileCount: number,
  totalFileCount: number,
  ratio: number,
  outdatedModuleCount: number,
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
  type: 'bundle_transform_progressed_throttled',
  entryFilePath: string,
  transformedFileCount: number,
  totalFileCount: number,
};

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
    entryFilePath: string,
    transformedFileCount: number,
    totalFileCount: number,
  }) => void;

  constructor() {
    this._dependencyGraphHasLoaded = false;
    this._activeBundles = new Map();
    this._scheduleUpdateBundleProgress = throttle((data) => {
      this.update({...data, type: 'bundle_transform_progressed_throttled'});
    }, 200);
  }

  /**
   * Return a message looking like this:
   *
   *     Transforming files  |####         | 34.2% (324/945)...
   *
   */
  _getFileTransformMessage(
    {totalFileCount, transformedFileCount, ratio, outdatedModuleCount}: BundleProgress,
    build: 'in_progress' | 'done',
  ): string {
    if (outdatedModuleCount > 0) {
      const plural = outdatedModuleCount > 1;
      return `Updating ${outdatedModuleCount} ` +
        `module${plural ? 's' : ''} in place` +
        (build === 'done' ? ', done' : '...');
    }
    if (totalFileCount === 0) {
      return build === 'done'
        ? 'No module changed.'
        : 'Analysing...';
    }
    return util.format(
      'Transforming modules  %s%s% (%s/%s)%s',
      build === 'done' ? '' : getProgressBar(ratio, 30) + '  ',
      (100 * ratio).toFixed(1),
      transformedFileCount,
      totalFileCount,
      build === 'done' ? ', done.' : '...',
    );
  }

  /**
   * Construct a message that represent the progress of a single bundle build.
   */
  _getBundleStatusMessage(
    entryFilePath: string,
    progress: BundleProgress,
    build: 'in_progress' | 'done',
  ): string {
    const localPath = path.relative('.', entryFilePath);
    return [
      `Bundling \`${localPath}\``,
      '  ' + this._getFileTransformMessage(progress, build),
    ].join('\n');
  }

  _logCacheDisabled(reason: GlobalCacheDisabledReason): void {
    const format = GLOBAL_CACHE_DISABLED_MESSAGE_FORMAT;
    switch (reason) {
      case 'too_many_errors':
        reporting.logWarning(terminal, format, 'it has been failing too many times.');
        break;
      case 'too_many_misses':
        reporting.logWarning(terminal, format, 'it has been missing too many consecutive keys.');
        break;
    }
  }

  /**
   * This function is only concerned with logging and should not do state
   * or terminal status updates.
   */
  _log(event: TerminalReportableEvent): void {
    switch (event.type) {
      case 'bundle_built':
        const progress = this._activeBundles.get(event.entryFilePath);
        if (progress != null) {
          terminal.log(
            this._getBundleStatusMessage(event.entryFilePath, progress, 'done'),
          );
        }
        break;
      case 'dep_graph_loaded':
        terminal.log(`${DEP_GRAPH_MESSAGE}, done.`);
        break;
      case 'global_cache_error':
        const message = JSON.stringify(event.error.message);
        reporting.logWarning(terminal, 'the global cache failed: %s', message);
        break;
      case 'global_cache_disabled':
        this._logCacheDisabled(event.reason);
        break;
      case 'transform_cache_reset':
        reporting.logWarning(terminal, 'the transform cache was reset.');
        break;
    }
  }

  /**
   * We use Math.pow(ratio, 2) to as a conservative measure of progress because
   * we know the `totalCount` is going to progressively increase as well. We
   * also prevent the ratio from going backwards.
   */
  _updateBundleProgress(
    {entryFilePath, transformedFileCount, totalFileCount}: {
      entryFilePath: string,
      transformedFileCount: number,
      totalFileCount: number,
    },
  ) {
    const currentProgress = this._activeBundles.get(entryFilePath);
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
      outdatedModuleCount: 0,
    });
  }

  _updateBundleOutdatedModuleCount(
    {entryFilePath, outdatedModuleCount}: {
      entryFilePath: string,
      outdatedModuleCount: number,
    },
  ) {
    const currentProgress = this._activeBundles.get(entryFilePath);
    if (currentProgress == null) {
      return;
    }
    currentProgress.outdatedModuleCount = outdatedModuleCount;
  }

  /**
   * This function is exclusively concerned with updating the internal state.
   * No logging or status updates should be done at this point.
   */
  _updateState(event: TerminalReportableEvent): void {
    switch (event.type) {
      case 'bundle_requested':
        this._activeBundles.set(event.entryFilePath, {
          transformedFileCount: 0,
          totalFileCount: 0,
          ratio: 0,
          outdatedModuleCount: 0,
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
      case 'bundle_update_existing':
        this._updateBundleOutdatedModuleCount(event);
        break;
      case 'bundle_built':
        this._activeBundles.delete(event.entryFilePath);
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
      ([entryFilePath, progress]) =>
        this._getBundleStatusMessage(entryFilePath, progress, 'in_progress'),
    )).filter(str => str != null).join('\n');
  }

  /**
   * Everything that happens goes through the same 3 steps. This makes the
   * output more reliable and consistent, because no matter what additional.
   */
  update(event: TerminalReportableEvent) {
    this._log(event);
    this._updateState(event);
    terminal.status(this._getStatusMessage());
  }

}

module.exports = TerminalReporter;
