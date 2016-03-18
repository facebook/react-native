/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const log = require('../util/log').out('bundle');
const outputBundle = require('./output/bundle');
const Promise = require('promise');
const ReactPackager = require('../../packager/react-packager');
const saveAssets = require('./saveAssets');

function buildBundle(args, config, output = outputBundle, packagerInstance) {
  return new Promise((resolve, reject) => {

    // This is used by a bazillion of npm modules we don't control so we don't
    // have other choice than defining it as an env variable here.
    process.env.NODE_ENV = args.dev ? 'development' : 'production';

    const options = {
      projectRoots: config.getProjectRoots(),
      assetRoots: config.getAssetRoots(),
      blacklistRE: config.getBlacklistRE(args.platform),
      getTransformOptionsModulePath: config.getTransformOptionsModulePath,
      transformModulePath: args.transformer,
      verbose: args.verbose,
    };

    const requestOpts = {
      entryFile: args['entry-file'],
      sourceMapUrl: args['sourcemap-output'],
      dev: args.dev,
      minify: !args.dev,
      platform: args.platform,
    };

    var bundlePromise;
    if (packagerInstance) {
      bundlePromise = output.build(packagerInstance, requestOpts)
        .then(bundle => {
          output.save(bundle, args, log);
          return bundle;
        });
    } else {
      const clientPromise = ReactPackager.createClientFor(options);

      // Build and save the bundle
      bundlePromise = clientPromise
        .then(client => {
          log('Created ReactPackager');
          return output.build(client, requestOpts);
        })
        .then(bundle => {
          output.save(bundle, args, log);
          return bundle;
        });

      // When we're done bundling, close the client
      Promise.all([clientPromise, bundlePromise])
        .then(([client]) => {
          log('Closing client');
          client.close();
        });
    }

    // Save the assets of the bundle
    const assets = bundlePromise
      .then(bundle => bundle.getAssets())
      .then(outputAssets => saveAssets(
        outputAssets,
        args.platform,
        args['assets-dest']
      ));

    // When we're done saving bundle output and the assets, we're done.
    resolve(assets);
  });
}

module.exports = buildBundle;
