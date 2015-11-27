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
const log = require('../util/log').out('bundle');
const Promise = require('promise');
const ReactPackager = require('../../packager/react-packager');
const saveAssets = require('./saveAssets');

const sign = require('./sign');

function saveBundleAndMap(
  bundle,
  bundleOutput,
  encoding,
  sourcemapOutput,
  dev
) {
  log('start');
  let codeWithMap;
  if (!dev) {
    codeWithMap = bundle.getMinifiedSourceAndMap(dev);
  } else {
    codeWithMap = {
      code: bundle.getSource({ dev }),
      map: JSON.stringify(bundle.getSourceMap({ dev })),
    };
  }
  log('finish');

  log('Writing bundle output to:', bundleOutput);
  fs.writeFileSync(bundleOutput, sign(codeWithMap.code), encoding);
  log('Done writing bundle output');

  if (sourcemapOutput) {
    log('Writing sourcemap output to:', sourcemapOutput);
    fs.writeFileSync(sourcemapOutput, codeWithMap.map);
    log('Done writing sourcemap output');
  }
}

function savePrepackBundleAndMap(
  bundle,
  bundleOutput,
  sourcemapOutput,
  bridgeConfig
) {
  log('Writing prepack bundle output to:', bundleOutput);
  const result = bundle.build({
    batchedBridgeConfig: bridgeConfig
  });
  fs.writeFileSync(bundleOutput, result, 'ucs-2');
  log('Done writing prepack bundle output');
}

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

    const prepack = args.prepack;

    const client = ReactPackager.createClientFor(options);

    client.then(() => log('Created ReactPackager'));

    // Build and save the bundle
    let bundle;
    if (prepack) {
      bundle = client.then(c => c.buildPrepackBundle(requestOpts))
        .then(outputBundle => {
          savePrepackBundleAndMap(
            outputBundle,
            args['bundle-output'],
            args['sourcemap-output'],
            args['bridge-config']
          );
          return outputBundle;
        });
    } else {
      bundle = client.then(c => c.buildBundle(requestOpts))
        .then(outputBundle => {
          saveBundleAndMap(
            outputBundle,
            args['bundle-output'],
            args['bundle-encoding'],
            args['sourcemap-output'],
            args.dev
          );
          return outputBundle;
        });
    }

    // When we're done bundling, close the client
    bundle.then(() => client.then(c => {
      log('Closing client');
      c.close();
    }));

    // Save the assets of the bundle
    const assets = bundle
        .then(outputBundle => outputBundle.getAssets())
        .then(outputAssets => saveAssets(
          outputAssets,
          args.platform,
          args['assets-dest']
        ));

    // When we're done saving the assets, we're done.
    resolve(assets);
  });
}

module.exports = buildBundle;
