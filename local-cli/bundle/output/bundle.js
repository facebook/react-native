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

const meta = require('./meta');
const relativizeSourceMap = require('../../../packager/src//lib/relativizeSourceMap');
const writeFile = require('./writeFile');

import type Bundle from '../../../packager/src//Bundler/Bundle';
import type Server from '../../../packager/src//Server';
import type {OutputOptions, RequestOptions} from '../types.flow';

function buildBundle(packagerClient: Server, requestOptions: RequestOptions) {
  return packagerClient.buildBundle({
    ...requestOptions,
    isolateModuleIDs: true,
  });
}

function createCodeWithMap(bundle: Bundle, dev: boolean, sourceMapSourcesRoot?: string): * {
  const map = bundle.getSourceMap({dev});
  const sourceMap = relativizeSourceMap(
    typeof map === 'string' ? JSON.parse(map) : map,
    sourceMapSourcesRoot);
  return {
    code: bundle.getSource({dev}),
    map: JSON.stringify(sourceMap),
  };
}

function saveBundleAndMap(
  bundle: Bundle,
  options: OutputOptions,
  log: (x: string) => {},
): Promise<> {
  const {
    bundleOutput,
    bundleEncoding: encoding,
    dev,
    sourcemapOutput,
    sourcemapSourcesRoot
  } = options;

  log('start');
  const codeWithMap = createCodeWithMap(bundle, !!dev, sourcemapSourcesRoot);
  log('finish');

  log('Writing bundle output to:', bundleOutput);

  const {code} = codeWithMap;
  const writeBundle = writeFile(bundleOutput, code, encoding);
  const writeMetadata = writeFile(
    bundleOutput + '.meta',
    meta(code, encoding),
    'binary');
  Promise.all([writeBundle, writeMetadata])
    .then(() => log('Done writing bundle output'));

  if (sourcemapOutput) {
    log('Writing sourcemap output to:', sourcemapOutput);
    const writeMap = writeFile(sourcemapOutput, codeWithMap.map, null);
    writeMap.then(() => log('Done writing sourcemap output'));
    return Promise.all([writeBundle, writeMetadata, writeMap]);
  } else {
    return writeBundle;
  }
}

exports.build = buildBundle;
exports.save = saveBundleAndMap;
exports.formatName = 'bundle';
