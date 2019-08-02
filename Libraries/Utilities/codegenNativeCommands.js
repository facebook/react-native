/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import {dispatchCommand} from '../../Libraries/Renderer/shims/ReactNative';

type Options<T = string> = $ReadOnly<{|
  supportedCommands: $ReadOnlyArray<T>,
|}>;

function codegenNativeCommands<T: {}>(options: Options<$Keys<T>>): T {
  const commandObj = {};

  options.supportedCommands.forEach(command => {
    commandObj[command] = (ref, ...args) => {
      dispatchCommand(ref, command, args);
    };
  });

  return ((commandObj: any): T);
}

export default codegenNativeCommands;
