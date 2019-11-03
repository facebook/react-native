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

import * as React from 'react';

const FlatList = require('../../../Lists/FlatList');

const createAnimatedComponent = require('../createAnimatedComponent');

/**
 * @see https://github.com/facebook/react-native/commit/b8c8562
 */
const FlatListWithEventThrottle = React.forwardRef((props, ref) => (
  <FlatList scrollEventThrottle={0.0001} {...props} ref={ref} />
));

module.exports = (createAnimatedComponent(
  FlatListWithEventThrottle,
): $FlowFixMe);
