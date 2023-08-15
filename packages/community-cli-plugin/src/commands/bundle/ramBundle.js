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

import type {Command, Config} from '@react-native-community/cli-types';
import type {CommandLineArgs} from './bundleCommandLineArgs';

import outputUnbundle from 'metro/src/shared/output/RamBundle';
import {bundleWithOutput} from './bundle';
import bundleCommandLineArgs from './bundleCommandLineArgs';

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function ramBundle(
  argv: Array<string>,
  config: Config,
  args: CommandLineArgs,
): Promise<void> {
  return bundleWithOutput(argv, config, args, outputUnbundle);
}

export default ({
  name: 'ram-bundle',
  description:
    'Build the RAM bundle for the provided JavaScript entry file. See https://reactnative.dev/docs/ram-bundles-inline-requires.',
  func: ramBundle,
  options: [
    ...bundleCommandLineArgs,
    {
      name: '--indexed-ram-bundle',
      description:
        'Force the "Indexed RAM" bundle file format, even when building for android',
      default: false,
    },
  ],
}: Command);

export {ramBundle};
