/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const FlatList = require('../../../Lists/FlatList');

const createAnimatedComponent = require('../createAnimatedComponent');

module.exports = createAnimatedComponent(FlatList, {
  scrollEventThrottle: 0.0001,
});
