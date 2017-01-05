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

const MAGIC_UNBUNDLE_NUMBER = require('./magic-number');

const buildSourceMapWithMetaData = require('./build-unbundle-sourcemap-with-metadata');
const mkdirp = require('mkdirp');
const path = require('path');
const writeFile = require('../writeFile');
const writeSourceMap = require('./write-sourcemap');

const {joinModules} = require('./util');

import type Bundle from '../../../../packager/react-packager/src/Bundler/Bundle';
import type {OutputOptions} from '../../types.flow';

// must not start with a dot, as that won't go into the apk
const MAGIC_UNBUNDLE_FILENAME = 'UNBUNDLE';
const MODULES_DIR = 'js-modules';

/**
 * Saves all JS modules of an app as single files
 * The startup code (prelude, polyfills etc.) are written to the file
 * designated by the `bundleOuput` option.
 * All other modules go into a 'js-modules' folder that in the same parent
 * directory as the startup file.
 */
function saveAsAssets(
  bundle: Bundle,
  options: OutputOptions,
  log: (x: string) => void,
): Promise<mixed> {
  const {
    bundleOutput,
    bundleEncoding: encoding,
    sourcemapOutput
  } = options;

  log('start');
  const {startupModules, lazyModules} = bundle.getUnbundle();
  log('finish');
  const startupCode = joinModules(startupModules);

  log('Writing bundle output to:', bundleOutput);
  const modulesDir = path.join(path.dirname(bundleOutput), MODULES_DIR);
  const writeUnbundle =
    createDir(modulesDir).then( // create the modules directory first
      () => Promise.all([
        writeModules(lazyModules, modulesDir, encoding),
        writeFile(bundleOutput, startupCode, encoding),
        writeMagicFlagFile(modulesDir),
      ])
    );
  writeUnbundle.then(() => log('Done writing unbundle output'));

  const sourceMap =
    buildSourceMapWithMetaData({
      startupModules: startupModules.concat(),
      lazyModules: lazyModules.concat(),
    });

  return Promise.all([
    writeUnbundle,
    sourcemapOutput && writeSourceMap(sourcemapOutput, JSON.stringify(sourceMap), log)
  ]);
}

function createDir(dirName) {
  return new Promise((resolve, reject) =>
    mkdirp(dirName, error => error ? reject(error) : resolve()));
}

function writeModuleFile(module, modulesDir, encoding) {
  const {code, id} = module;
  return writeFile(path.join(modulesDir, id + '.js'), code, encoding);
}

function writeModules(modules, modulesDir, encoding) {
  const writeFiles =
    modules.map(module => writeModuleFile(module, modulesDir, encoding));
  return Promise.all(writeFiles);
}

function writeMagicFlagFile(outputDir) {
  /* global Buffer: true */
  const buffer = new Buffer(4);
  buffer.writeUInt32LE(MAGIC_UNBUNDLE_NUMBER, 0);
  return writeFile(path.join(outputDir, MAGIC_UNBUNDLE_FILENAME), buffer);
}

module.exports = saveAsAssets;
