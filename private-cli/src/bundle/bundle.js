/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const log = require('../util/log').out('bundle');
const parseCommandLine = require('../../../packager/parseCommandLine');
const processBundle = require('./processBundle');
const Promise = require('promise');
const ReactPackager = require('../../../packager/react-packager');
const saveBundleAndMap = require('./saveBundleAndMap');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function bundle(argv, config) {
  return new Promise((resolve, reject) => {
    _bundle(argv, config, resolve, reject);
  });
}

function _bundle(argv, config, resolve, reject) {
  const args = parseCommandLine([
    {
      command: 'entry-file',
      description: 'Path to the root JS file, either absolute or relative to JS root',
      type: 'string',
      required: true,
    }, {
      command: 'platform',
      description: 'Either "ios" or "android"',
      type: 'string',
      required: true,
    }, {
      command: 'transformer',
      description: 'Specify a custom transformer to be used (absolute path)',
      type: 'string',
      default: require.resolve('../../../packager/transformer'),
    }, {
      command: 'dev',
      description: 'If false, warnings are disabled and the bundle is minified',
      default: true,
    }, {
      command: 'bundle-output',
      description: 'File name where to store the resulting bundle, ex. /tmp/groups.bundle',
      type: 'string',
      required: true,
    }, {
      command: 'sourcemap-output',
      description: 'File name where to store the sourcemap file for resulting bundle, ex. /tmp/groups.map',
      type: 'string',
    }, {
      command: 'assets-dest',
      description: 'Directory name where to store assets referenced in the bundle',
      type: 'string',
    }, {
      command: 'verbose',
      description: 'Enables logging',
      default: false,
    },
  ], argv);

  // This is used by a bazillion of npm modules we don't control so we don't
  // have other choice than defining it as an env variable here.
  process.env.NODE_ENV = args.dev ? 'development' : 'production';

  const options = {
    projectRoots: config.getProjectRoots(),
    assetRoots: config.getAssetRoots(),
    blacklistRE: config.getBlacklistRE(args.platform),
    transformModulePath: args.transformer,
    verbose: args.verbose,
  };

  const requestOpts = {
    entryFile: args['entry-file'],
    dev: args.dev,
    minify: !args.dev,
    platform: args.platform,
  };

  resolve(ReactPackager.createClientFor(options).then(client => {
    log('Created ReactPackager');
    return client.buildBundle(requestOpts)
      .then(outputBundle => {
        log('Closing client');
        client.close();
        return outputBundle;
      })
      .then(outputBundle => processBundle(outputBundle, !args.dev))
      .then(outputBundle => saveBundleAndMap(
        outputBundle,
        args.platform,
        args['bundle-output'],
        args['sourcemap-output'],
        args['assets-dest']
      ));
  }));
}

module.exports = bundle;
