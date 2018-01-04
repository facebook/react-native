/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Metro = require('metro');

const denodeify = require('denodeify');
const fs = require('fs');
const path = require('path');

const {ASSET_REGISTRY_PATH} = require('../core/Constants');

function dependencies(argv, config, args, packagerInstance) {
  const rootModuleAbsolutePath = args.entryFile;
  if (!fs.existsSync(rootModuleAbsolutePath)) {
    return Promise.reject(new Error(`File ${rootModuleAbsolutePath} does not exist`));
  }

  const transformModulePath =
      args.transformer ? path.resolve(args.transformer) :
      typeof config.getTransformModulePath === 'function' ? config.getTransformModulePath() :
      undefined;

  const packageOpts = {
    assetRegistryPath: ASSET_REGISTRY_PATH,
    projectRoots: config.getProjectRoots(),
    blacklistRE: config.getBlacklistRE(),
    getPolyfills: config.getPolyfills,
    getTransformOptions: config.getTransformOptions,
    hasteImpl: config.hasteImpl,
    postMinifyProcess: config.postMinifyProcess,
    transformModulePath: transformModulePath,
    extraNodeModules: config.extraNodeModules,
    verbose: config.verbose,
    workerPath: config.getWorkerPath(),
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
    dev: args.dev,
    minify: false,
    generateSourceMaps: !args.dev,
  };

  const writeToFile = args.output;
  const outStream = writeToFile
    ? fs.createWriteStream(args.output)
    : process.stdout;

  return Promise.resolve((packagerInstance ?
    packagerInstance.getOrderedDependencyPaths(options) :
    Metro.getOrderedDependencyPaths(packageOpts, options)).then(
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
        ? denodeify(outStream.end).bind(outStream)()
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
      command: '--max-workers [number]',
      description: 'Specifies the maximum number of workers the worker-pool ' +
        'will spawn for transforming files. This defaults to the number of the ' +
        'cores available on your machine.',
      parse: (workers: string) => Number(workers),
    }, {
      command: '--dev [boolean]',
      description: 'If false, skip all dev-only code path',
      parse: (val) => val === 'false' ? false : true,
      default: true,
    }, {
      command: '--verbose',
      description: 'Enables logging',
      default: false,
    },
  ],
};
