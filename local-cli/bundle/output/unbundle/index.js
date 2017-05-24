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

const Server = require('../../../../packager/src/Server');

const asAssets = require('./as-assets');
const asIndexedFile = require('./as-indexed-file');

import type Bundle from '../../../../packager/src//Bundler/Bundle';
import type {OutputOptions, RequestOptions} from '../../types.flow';

function buildBundle(packagerClient: Server, requestOptions: RequestOptions) {
  return packagerClient.buildBundle({
    ...Server.DEFAULT_BUNDLE_OPTIONS,
    ...requestOptions,
    unbundle: true,
    isolateModuleIDs: true,
  });
}

function saveUnbundle(
  bundle: Bundle,
  options: OutputOptions,
  log: (x: string) => void,
): Promise<mixed> {
  // we fork here depending on the platform:
  // while android is pretty good at loading individual assets, ios has a large
  // overhead when reading hundreds pf assets from disk
  return options.platform === 'android' && !options.indexedUnbundle ?
    asAssets(bundle, options, log) :
    asIndexedFile(bundle, options, log);
}

exports.build = buildBundle;
exports.save = saveUnbundle;
exports.formatName = 'bundle';
