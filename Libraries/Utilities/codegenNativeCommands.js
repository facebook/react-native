/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const {dispatchCommand} = require('../ReactNative/RendererProxy');

type Options<T = string> = $ReadOnly<{|
  supportedCommands: $ReadOnlyArray<T>,
|}>;

function codegenNativeCommands<T: interface {}>(options: Options<$Keys<T>>): T {
  const commandObj: {[$Keys<T>]: (...$ReadOnlyArray<mixed>) => void} = {};

  options.supportedCommands.forEach(command => {
    commandObj[command] = (ref, ...args) => {
      // $FlowFixMe[incompatible-call]
      dispatchCommand(ref, command, args);
    };
  });

  return ((commandObj: any): T);
}

export default codegenNativeCommands;
