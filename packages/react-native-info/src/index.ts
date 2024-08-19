/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import loadConfig from '@react-native-community/cli-config';

import {program} from 'commander';
import info from './info';
import {CliOptions} from './types';

const {version} = require('../package.json');

program
  .name('react-native-info')
  .description('Get relevant version info about OS, toolchain and libraries')
  .version(version)
  .option('--json', 'Output in JSON format')
  .parse(process.argv);

async function main() {
  const config = loadConfig();
  const options: CliOptions = program.opts();
  await info(options, config);
}

main();
