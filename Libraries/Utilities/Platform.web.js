/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

export type PlatformSelectSpec<D, I> = {
  default?: D,
  web?: I,
};

const Platform = {
  OS: 'web',
  select: <D, I>(spec: PlatformSelectSpec<D, I>): D | I =>
    'web' in spec ? spec.web : spec.default,
};

module.exports = Platform;
