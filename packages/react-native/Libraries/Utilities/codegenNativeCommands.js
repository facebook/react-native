/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {dispatchCommand} = require('../ReactNative/RendererProxy');

type NativeCommandsOptions<T = string> = $ReadOnly<{
  supportedCommands: $ReadOnlyArray<T>,
}>;

function codegenNativeCommands<T: interface {}>(
  options: NativeCommandsOptions<$Keys<T>>,
): T {
  const commandObj: {[$Keys<T>]: (...$ReadOnlyArray<mixed>) => void} = {};

  options.supportedCommands.forEach(command => {
    // $FlowFixMe[missing-local-annot]
    commandObj[command] = (ref, ...args) => {
      // $FlowFixMe[incompatible-type]
      dispatchCommand(ref, command, args);
    };
  });

  return ((commandObj: any): T);
}

export default codegenNativeCommands;
