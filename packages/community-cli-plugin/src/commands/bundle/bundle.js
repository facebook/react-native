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
import type {CommandLineArgs} from './bundleCommandLineArgs';

import buildBundle from './buildBundle';
import bundleCommandLineArgs from './bundleCommandLineArgs';

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
export function bundleWithOutput(
  _: Array<string>,
  config: Config,
  args: CommandLineArgs,
  // $FlowFixMe[unclear-type] untyped metro/src/shared/output/bundle or metro/src/shared/output/RamBundle
  output: any,
): Promise<void> {
  return buildBundle(args, config, output);
}

const bundleCommand = {
  name: 'bundle',
  description: 'Build the bundle for the provided JavaScript entry file.',
  func: bundleWithOutput,
  options: bundleCommandLineArgs,
};

export default bundleCommand;
