/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * `global` is a object containing all the global variables for React Native.
 *
 * NOTE: Consider cross-platform as well as JS environments compatibility
 * when defining the types here. Consider both presence (`?`) as well as
 * writeability (`+`) when defining types.
 */
declare var global: {
  +HermesInternal: ?$HermesInternalType,

  // Undeclared properties are implicitly `any`.
  [string | symbol]: any,
};
