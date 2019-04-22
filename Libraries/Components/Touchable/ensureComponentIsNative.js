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

const invariant = require('invariant');

const ensureComponentIsNative = function(component: any) {
  invariant(
    component && typeof component.setNativeProps === 'function',
    'Touchable child must either be native or forward setNativeProps to a ' +
      'native component',
  );
};

module.exports = ensureComponentIsNative;
