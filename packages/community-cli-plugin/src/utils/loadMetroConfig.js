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
import type {ConfigT, InputConfigT, YargArguments} from 'metro-config';

import path from 'path';
import {loadConfig, mergeConfig, resolveConfig} from 'metro-config';
import {CLIError, logger} from '@react-native-community/cli-tools';
import {reactNativePlatformResolver} from './metroPlatformResolver';

export type {Config};

export type ConfigLoadingContext = $ReadOnly<{
  root: Config['root'],
  reactNativePath: Config['reactNativePath'],
  platforms: Config['platforms'],
  ...
}>;

/**
 * Get the config options to override based on RN CLI inputs.
 */
function getOverrideConfig(ctx: ConfigLoadingContext): InputConfigT {
  const outOfTreePlatforms = Object.keys(ctx.platforms).filter(
    platform => ctx.platforms[platform].npmPackageName,
  );
  const resolver: Partial<{...ConfigT['resolver']}> = {
    platforms: [...Object.keys(ctx.platforms), 'native'],
  };

  if (outOfTreePlatforms.length) {
    resolver.resolveRequest = reactNativePlatformResolver(
      outOfTreePlatforms.reduce<{[platform: string]: string}>(
        (result, platform) => {
          result[platform] = ctx.platforms[platform].npmPackageName;
          return result;
        },
        {},
      ),
    );
  }

  return {
    resolver,
    serializer: {
      // We can include multiple copies of InitializeCore here because metro will
      // only add ones that are already part of the bundle
      getModulesRunBeforeMainModule: () => [
        require.resolve(
          path.join(ctx.reactNativePath, 'Libraries/Core/InitializeCore'),
          {paths: [ctx.root]},
        ),
        ...outOfTreePlatforms.map(platform =>
          require.resolve(
            `${ctx.platforms[platform].npmPackageName}/Libraries/Core/InitializeCore`,
          ),
        ),
      ],
    },
  };
}

/**
 * Load Metro config.
 *
 * Allows the CLI to override select values in `metro.config.js` based on
 * dynamic user options in `ctx`.
 */
export default async function loadMetroConfig(
  ctx: ConfigLoadingContext,
  options: YargArguments = {},
): Promise<ConfigT> {
  const overrideConfig = getOverrideConfig(ctx);

  const cwd = ctx.root;
  const projectConfig = await resolveConfig(options.config, cwd);

  if (projectConfig.isEmpty) {
    throw new CLIError(`No Metro config found in ${cwd}`);
  }

  logger.debug(`Reading Metro config from ${projectConfig.filepath}`);

  if (!global.__REACT_NATIVE_METRO_CONFIG_LOADED) {
    const warning = `
=================================================================================================
From React Native 0.73, your project's Metro config should extend '@react-native/metro-config'
or it will fail to build. Please copy the template at:
https://github.com/facebook/react-native/blob/main/packages/react-native/template/metro.config.js
This warning will be removed in future (https://github.com/facebook/metro/issues/1018).
=================================================================================================
    `;

    for (const line of warning.trim().split('\n')) {
      logger.warn(line);
    }
  }

  return mergeConfig(
    await loadConfig({
      cwd,
      ...options,
    }),
    overrideConfig,
  );
}
