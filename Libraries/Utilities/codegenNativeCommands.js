/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

let dispatchCommand;
if (global.RN$Bridgeless) {
  // Note: this function has the same implementation in the legacy and new renderer.
  // However, evaluating the old renderer comes with some side effects.
  dispatchCommand =
    require('../../Libraries/Renderer/shims/ReactFabric').dispatchCommand;
} else {
  dispatchCommand =
    require('../../Libraries/Renderer/shims/ReactNative').dispatchCommand;
}

type Options<T = string> = $ReadOnly<{|
  supportedCommands: $ReadOnlyArray<T>,
|}>;

function codegenNativeCommands<T: interface {}>(options: Options<$Keys<T>>): T {
  const commandObj: {[$Keys<T>]: (...$ReadOnlyArray<mixed>) => void} = {};

  options.supportedCommands.forEach(command => {
    commandObj[command] = (ref, ...args) => {
      dispatchCommand(ref, command, args);
    };
  });

  return ((commandObj: any): T);
}

export default codegenNativeCommands;
