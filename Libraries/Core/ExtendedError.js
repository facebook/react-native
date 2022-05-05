/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type ExtendedError = Error & {
  jsEngine?: string,
  preventSymbolication?: boolean,
  componentStack?: string,
  isComponentError?: boolean,
  type?: string,
  ...
};
