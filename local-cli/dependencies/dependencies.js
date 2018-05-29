/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const Metro = require('metro');

const denodeify = require('denodeify');
const fs = require('fs');
const path = require('path');

async function dependencies(argv, configPromise, args, packagerInstance) {
  const rootModuleAbsolutePath = args.entryFile;
  const config = await configPromise;
  if (!fs.existsSync(rootModuleAbsolutePath)) {
    return Promise.reject(
      new Error(`File ${rootModuleAbsolutePath} does not exist`),
    );
  }

  config.cacheStores = [];

  const relativePath = path.relative(
    config.projectRoot,
    rootModuleAbsolutePath,
  );

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

  const deps = packagerInstance
    ? await packagerInstance.getOrderedDependencyPaths(options)
    : await Metro.getOrderedDependencyPaths(config, options);

  deps.forEach(modulePath => {
    // Temporary hack to disable listing dependencies not under this directory.
    // Long term, we need either
    // (a) JS code to not depend on anything outside this directory, or
    // (b) Come up with a way to declare this dependency in Buck.
    const isInsideProjectRoots =
      config.watchFolders.filter(root => modulePath.startsWith(root)).length >
      0;

    if (isInsideProjectRoots) {
      outStream.write(modulePath + '\n');
    }
  });
  return writeToFile
    ? denodeify(outStream.end).bind(outStream)()
    : Promise.resolve();
}

module.exports = {
  name: 'dependencies',
  description: 'lists dependencies',
  func: dependencies,
  options: [
    {
      command: '--entry-file <path>',
      description: 'Absolute path to the root JS file',
    },
    {
      command: '--output [path]',
      description:
        'File name where to store the output, ex. /tmp/dependencies.txt',
    },
    {
      command: '--platform [extension]',
      description: 'The platform extension used for selecting modules',
    },
    {
      command: '--transformer [path]',
      description: 'Specify a custom transformer to be used',
    },
    {
      command: '--max-workers [number]',
      description:
        'Specifies the maximum number of workers the worker-pool ' +
        'will spawn for transforming files. This defaults to the number of the ' +
        'cores available on your machine.',
      parse: (workers: string) => Number(workers),
    },
    {
      command: '--dev [boolean]',
      description: 'If false, skip all dev-only code path',
      parse: val => (val === 'false' ? false : true),
      default: true,
    },
    {
      command: '--verbose',
      description: 'Enables logging',
      default: false,
    },
  ],
};
