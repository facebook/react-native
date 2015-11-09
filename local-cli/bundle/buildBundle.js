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
const processBundle = require('./processBundle');
const Promise = require('promise');
const ReactPackager = require('../../packager/react-packager');
const saveBundleAndMap = require('./saveBundleAndMap');

function buildBundle(args, config) {
  return new Promise((resolve, reject) => {

    // This is used by a bazillion of npm modules we don't control so we don't
    // have other choice than defining it as an env variable here.
    process.env.NODE_ENV = args.dev ? 'development' : 'production';

    const options = {
      projectRoots: config.getProjectRoots(),
      assetRoots: config.getAssetRoots(),
      blacklistRE: config.getBlacklistRE(),
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
          args['bundle-encoding'],
          args['sourcemap-output'],
          args['assets-dest']
        ));
    }));
  });
}

module.exports = buildBundle;
