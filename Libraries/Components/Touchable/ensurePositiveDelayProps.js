/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ensurePositiveDelayProps
 * @flow
 */
'use strict';

const invariant = require('fbjs/lib/invariant');

const ensurePositiveDelayProps = function(props: any) {
  invariant(
    !(props.delayPressIn < 0 || props.delayPressOut < 0 ||
      props.delayLongPress < 0),
    'Touchable components cannot have negative delay properties'
  );
};

module.exports = ensurePositiveDelayProps;
