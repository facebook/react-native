/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {Config} from '@react-native-community/cli-types';
import type {RequestOptions} from 'metro/src/shared/types.flow';
import type {ConfigT} from 'metro-config';

import Server from 'metro/src/Server';
import metroBundle from 'metro/src/shared/output/bundle';
import metroRamBundle from 'metro/src/shared/output/RamBundle';
import path from 'path';
import chalk from 'chalk';
import saveAssets from './saveAssets';
import loadMetroConfig from '../../utils/loadMetroConfig';
import {logger} from '@react-native-community/cli-tools';

export type BundleCommandArgs = {
  assetsDest?: string,
  assetCatalogDest?: string,
  entryFile: string,
  resetCache: boolean,
  resetGlobalCache: boolean,
  transformer?: string,
  minify?: boolean,
  config?: string,
  platform: string,
  dev: boolean,
  bundleOutput: string,
  bundleEncoding?: 'utf8' | 'utf16le' | 'ascii',
  maxWorkers?: number,
  sourcemapOutput?: string,
  sourcemapSourcesRoot?: string,
  sourcemapUseAbsolutePath: boolean,
  verbose: boolean,
  unstableTransformProfile: string,
  indexedRamBundle?: boolean,
};

async function buildBundle(
  _argv: Array<string>,
  ctx: Config,
  args: BundleCommandArgs,
  bundleImpl: typeof metroBundle | typeof metroRamBundle = metroBundle,
): Promise<void> {
  const config = await loadMetroConfig(ctx, {
    maxWorkers: args.maxWorkers,
    resetCache: args.resetCache,
    config: args.config,
  });

  return buildBundleWithConfig(args, config, bundleImpl);
}

async function buildBundleWithConfig(
  args: BundleCommandArgs,
  config: ConfigT,
  bundleImpl: typeof metroBundle | typeof metroRamBundle = metroBundle,
): Promise<void> {
  if (config.resolver.platforms.indexOf(args.platform) === -1) {
    logger.error(
      `Invalid platform ${
        args.platform ? `"${chalk.bold(args.platform)}" ` : ''
      }selected.`,
    );

    logger.info(
      `Available platforms are: ${config.resolver.platforms
        .map(x => `"${chalk.bold(x)}"`)
        .join(
          ', ',
        )}. If you are trying to bundle for an out-of-tree platform, it may not be installed.`,
    );

    throw new Error('Bundling failed');
  }

  // This is used by a bazillion of npm modules we don't control so we don't
  // have other choice than defining it as an env variable here.
  process.env.NODE_ENV = args.dev ? 'development' : 'production';

  let sourceMapUrl = args.sourcemapOutput;
  if (sourceMapUrl != null && !args.sourcemapUseAbsolutePath) {
    sourceMapUrl = path.basename(sourceMapUrl);
  }

  // $FlowIgnore[prop-missing]
  const requestOpts: RequestOptions & {...} = {
    entryFile: args.entryFile,
    sourceMapUrl,
    dev: args.dev,
    minify: args.minify !== undefined ? args.minify : !args.dev,
    platform: args.platform,
    unstable_transformProfile: args.unstableTransformProfile,
  };
  const server = new Server(config);

  try {
    const bundle = await bundleImpl.build(server, requestOpts);

    // $FlowIgnore[class-object-subtyping]
    // $FlowIgnore[incompatible-call]
    // $FlowIgnore[prop-missing]
    // $FlowIgnore[incompatible-exact]
    await bundleImpl.save(bundle, args, logger.info);

    // Save the assets of the bundle
    const outputAssets = await server.getAssets({
      ...Server.DEFAULT_BUNDLE_OPTIONS,
      ...requestOpts,
      bundleType: 'todo',
    });

    // When we're done saving bundle output and the assets, we're done.
    return await saveAssets(
      outputAssets,
      args.platform,
      args.assetsDest,
      args.assetCatalogDest,
    );
  } finally {
    server.end();
  }
}

/**
 * UNSTABLE: This function is likely to be relocated and its API changed in
 * the near future. `@react-native/community-cli-plugin` should not be directly
 * depended on by projects or integrators -- this is exported for legacy
 * compatibility.
 *
 * Create a bundle using a pre-loaded Metro config. The config can be
 * re-used for several bundling calls if multiple platforms are being
 * bundled.
 */
export const unstable_buildBundleWithConfig = buildBundleWithConfig;

export default buildBundle;
