/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import loadBundle from './loadBundle';

type Options = {isPrefetchOnly: boolean, ...};

type ImportBundleNames = {
  [string]: string,
  __proto__: null,
  ...
};

type MetroRequire = {
  (number): mixed,
  importAll: number => mixed,
  ...
};

declare var global: {globalEvalWithSourceUrl?: (string, string) => mixed, ...};

const dynamicRequire: MetroRequire = (require: $FlowFixMe);

const DEFAULT_OPTIONS = {isPrefetchOnly: false};
const IMPORT_BUNDLE_NAMES: ImportBundleNames = Object.create(null);
const importBundlePromises: {
  [string]: Promise<mixed>,
  __proto__: null,
  ...
} = Object.create(null);

async function asyncRequire(
  moduleID: number,
  moduleName: string,
  options?: Options = DEFAULT_OPTIONS,
): Promise<mixed> {
  if (options.isPrefetchOnly) {
    return Promise.resolve();
  }

  const stringModuleID = String(moduleID);
  const bundlePath = IMPORT_BUNDLE_NAMES[stringModuleID];
  if (bundlePath) {
    if (!importBundlePromises[stringModuleID]) {
      importBundlePromises[stringModuleID] = loadBundle(bundlePath).then(() =>
        dynamicRequire(moduleID),
      );
    }
    return importBundlePromises[stringModuleID];
  }

  return dynamicRequire.importAll(moduleID);
}
asyncRequire.prefetch = function(moduleID: number, moduleName: string): void {
  asyncRequire(moduleID, moduleName, {isPrefetchOnly: true}).then(
    () => {},
    () => {},
  );
};

asyncRequire.resource = function(moduleID: number, moduleName: string): empty {
  throw new Error('Not implemented');
};

asyncRequire.addImportBundleNames = function(
  importBundleNames: ImportBundleNames,
): void {
  Object.assign(IMPORT_BUNDLE_NAMES, importBundleNames);
};

module.exports = asyncRequire;
