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

type Options<T = string> = $ReadOnly<{|
  supportedCommands: $ReadOnlyArray<T>,
|}>;

function codegenNativeCommands<T>(options: Options<$Keys<T>>): T {
  return (({}: any): T);
}

export default codegenNativeCommands;
