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

import type {BundleCommandArgs} from '../bundle';
import type {Command, Config} from '@react-native-community/cli-types';

import bundleCommand from '../bundle';
import buildBundle from '../bundle/buildBundle';
import metroRamBundle from 'metro/src/shared/output/RamBundle';

const ramBundleCommand: Command = {
  name: 'ram-bundle',
  description:
    'Build the RAM bundle for the provided JavaScript entry file. See https://reactnative.dev/docs/ram-bundles-inline-requires.',
  func: (argv: Array<string>, config: Config, args: BundleCommandArgs) => {
    return buildBundle(argv, config, args, metroRamBundle);
  },
  options: [
    // $FlowFixMe[incompatible-type] options is nonnull
    ...bundleCommand.options,
    {
      name: '--indexed-ram-bundle',
      description:
        'Force the "Indexed RAM" bundle file format, even when building for android',
      default: false,
    },
  ],
};

export default ramBundleCommand;
