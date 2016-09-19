/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const fs = require('fs');
const path = require('path');
const Promise = require('promise');
const ReactPackager = require('../../packager/react-packager');

function dependencies(argv, config, args, packagerInstance) {
  const rootModuleAbsolutePath = args.entryFile;
  if (!fs.existsSync(rootModuleAbsolutePath)) {
    return Promise.reject(`File ${rootModuleAbsolutePath} does not exist`);
  }

  const transformModulePath =
      args.transformer ? path.resolve(args.transformer) :
      typeof config.getTransformModulePath === 'function' ? config.getTransformModulePath() :
      undefined;

  const packageOpts = {
    projectRoots: config.getProjectRoots(),
    assetRoots: config.getAssetRoots(),
    blacklistRE: config.getBlacklistRE(args.platform),
    getTransformOptionsModulePath: config.getTransformOptionsModulePath,
    transformModulePath: transformModulePath,
    extraNodeModules: config.extraNodeModules,
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

  return Promise.resolve((packagerInstance ?
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

module.exports = {
  name: 'dependencies',
  func: dependencies,
  options: [
    {
      command: '--entry-file <path>',
      description: 'Absolute path to the root JS file',
    }, {
      command: '--output [path]',
      description: 'File name where to store the output, ex. /tmp/dependencies.txt',
    }, {
      command: '--platform [extension]',
      description: 'The platform extension used for selecting modules',
    }, {
      command: '--transformer [path]',
      description: 'Specify a custom transformer to be used'
    }, {
      command: '--verbose',
      description: 'Enables logging',
      default: false,
    },
  ],
};
