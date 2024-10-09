/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import {getEnvironmentInfoAsJson} from './envinfo';
import {logger, version} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import {readFileSync} from 'fs';
import path from 'path';
import {stringify} from 'yaml';
import {CliOptions} from './types';

type PlatformValues = {
  hermesEnabled: boolean | string;
  newArchEnabled: boolean | string;
};

interface Platforms {
  Android: PlatformValues;
  iOS: PlatformValues;
}

const notFound = 'Not found';

function fileContains(str: string, filePath: string[]): boolean | string {
  try {
    return readFileSync(path.join(...filePath), {encoding: 'utf8'}).includes(
      str,
    );
  } catch {
    return notFound;
  }
}

export default async function getInfo(options: CliOptions, ctx: Config) {
  try {
    logger.info('Fetching system and libraries information...');

    const platforms: Platforms = {
      Android: {
        hermesEnabled: notFound,
        newArchEnabled: notFound,
      },
      iOS: {
        hermesEnabled: notFound,
        newArchEnabled: notFound,
      },
    };

    if (process.platform !== 'win32' && ctx.project.ios?.sourceDir) {
      platforms.iOS.hermesEnabled = fileContains('hermes-engine', [
        ctx.project.ios.sourceDir,
        'Podfile.lock',
      ]);
      platforms.iOS.newArchEnabled = fileContains('-DRCT_NEW_ARCH_ENABLED=1', [
        ctx.project.ios.sourceDir,
        'Pods',
        'Pods.xcodeproj',
        'project.pbxproj',
      ]);
    }

    if (ctx.project.android?.sourceDir) {
      platforms.Android.hermesEnabled = fileContains('hermesEnabled=true', [
        ctx.project.Android.sourceDir,
        'Podfile.lock',
      ]);
      platforms.Android.newArchEnabled = fileContains('newArchEnabled=true', [
        ctx.project.Android.sourceDir,
        'Podfile.lock',
      ]);
    }

    const output = {
      ...(await getEnvironmentInfoAsJson()),
      ...platforms,
    };

    if (options.json) {
      logger.log(JSON.stringify(output, null, 2));
    } else {
      logger.log(stringify(output));
    }
  } catch (err) {
    logger.error(`Unable to print environment info.\n${err}`);
  } finally {
    await version.logIfUpdateAvailable(ctx.root);
  }
}
