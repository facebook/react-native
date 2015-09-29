/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');
const log = require('../util/log').out('dependencies');
const parseCommandLine = require('../../../packager/parseCommandLine');
const path = require('path');
const Promise = require('Promise');
const ReactPackager = require('../../../packager/react-packager');

/**
 * Returns the dependencies an entry path has.
 */
function dependencies(argv, conf) {
  return new Promise((resolve, reject) => {
    _dependencies(argv, conf, resolve, reject);
  });
}

function _dependencies(argv, conf, resolve, reject) {
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
    },
  ], argv);

  const rootModuleAbsolutePath = args['entry-file'];
  if (!fs.existsSync(rootModuleAbsolutePath)) {
    reject(`File ${rootModuleAbsolutePath} does not exist`);
  }

  const config = {
    projectRoots: conf.getProjectRoots(),
    assetRoots: conf.getAssetRoots(),
    blacklistRE: conf.getBlacklistRE(),
    transformModulePath: conf.getTransformModulePath(),
  };

  const relativePath = config.projectRoots.map(root =>
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

  log('Running ReactPackager');
  log('Waiting for the packager.');
  resolve(ReactPackager.createClientFor(config).then(client => {
    log('Packager client was created');
    return client.getDependencies(options)
      .then(deps => {
        log('Packager returned dependencies');
        client.close();

        deps.forEach(module => {
          // Temporary hack to disable listing dependencies not under this directory.
          // Long term, we need either
          // (a) JS code to not depend on anything outside this directory, or
          // (b) Come up with a way to declare this dependency in Buck.
          const isInsideProjectRoots = config.projectRoots.filter(root =>
            module.path.startsWith(root)
          ).length > 0;

          if (isInsideProjectRoots) {
            outStream.write(module.path + '\n');
          }
        });
        writeToFile && outStream.end();
        log('Wrote dependencies to output file');
      });
  }));
}

module.exports = dependencies;
