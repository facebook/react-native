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

const ensurePositiveDelayProps = function(props: any) {
  invariant(
    !(
      props.delayPressIn < 0 ||
      props.delayPressOut < 0 ||
      props.delayLongPress < 0
    ),
    'Touchable components cannot have negative delay properties',
  );
};

module.exports = ensurePositiveDelayProps;
