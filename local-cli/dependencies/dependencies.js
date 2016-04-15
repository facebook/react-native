/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const fs = require('fs');
const parseCommandLine = require('../util/parseCommandLine');
const path = require('path');
const Promise = require('promise');
const ReactPackager = require('../../packager/react-packager');

/**
 * Returns the dependencies an entry path has.
 */
function dependencies(argv, config, packagerInstance) {
  return new Promise((resolve, reject) => {
    _dependencies(argv, config, resolve, reject, packagerInstance);
  });
}

function _dependencies(argv, config, resolve, reject, packagerInstance) {
  const args = parseCommandLine([
    {
      command: 'entry-file',
      description: 'Absolute path to the root JS file',
      type: 'string',
      required: true,
    }, {
      command: 'output',
      description: 'File name where to store the output, ex. /tmp/dependencies.txt',
      type: 'string',
    }, {
      command: 'platform',
      description: 'The platform extension used for selecting modules',
      type: 'string',
    }, {
      command: 'transformer',
      type: 'string',
      default: require.resolve('../../packager/transformer'),
      description: 'Specify a custom transformer to be used (absolute path)'
    }, {
      command: 'verbose',
      description: 'Enables logging',
      default: false,
    }
  ], argv);

  const rootModuleAbsolutePath = args['entry-file'];
  if (!fs.existsSync(rootModuleAbsolutePath)) {
    reject(`File ${rootModuleAbsolutePath} does not exist`);
  }

  const packageOpts = {
    projectRoots: config.getProjectRoots(),
    assetRoots: config.getAssetRoots(),
    blacklistRE: config.getBlacklistRE(args.platform),
    getTransformOptionsModulePath: config.getTransformOptionsModulePath,
    transformModulePath: args.transformer,
    verbose: config.verbose,
  };

  const relativePath = packageOpts.projectRoots.map(root =>
    path.relative(
      root,
      rootModuleAbsolutePath
    )
  )[0];

  const options = {
    platform: args.platform,
    entryFile: relativePath,
  };

  const writeToFile = args.output;
  const outStream = writeToFile
    ? fs.createWriteStream(args.output)
    : process.stdout;

  resolve((packagerInstance ?
    packagerInstance.getOrderedDependencyPaths(options) :
    ReactPackager.getOrderedDependencyPaths(packageOpts, options)).then(
    deps => {
      deps.forEach(modulePath => {
        // Temporary hack to disable listing dependencies not under this directory.
        // Long term, we need either
        // (a) JS code to not depend on anything outside this directory, or
        // (b) Come up with a way to declare this dependency in Buck.
        const isInsideProjectRoots = packageOpts.projectRoots.filter(
          root => modulePath.startsWith(root)
        ).length > 0;

        if (isInsideProjectRoots) {
          outStream.write(modulePath + '\n');
        }
      });
      return writeToFile
        ? Promise.denodeify(outStream.end).bind(outStream)()
        : Promise.resolve();
    }
  ));
}

module.exports = dependencies;
