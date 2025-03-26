/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

export default function ensureInstance<T>(value: mixed, Class: Class<T>): T {
  if (!(value instanceof Class)) {
    // $FlowIssue[incompatible-use]
    const className = Class.name;
    throw new Error(
      `Expected instance of ${className} but got ${String(value)}`,
    );
  }

  return value;
}
