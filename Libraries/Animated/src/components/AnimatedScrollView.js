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

const ScrollView = require('../../../Components/ScrollView/ScrollView');

const createAnimatedComponent = require('../createAnimatedComponent');

/**
 * @see https://github.com/facebook/react-native/commit/b8c8562
 */
const ScrollViewWithEventThrottle = React.forwardRef((props, ref) => (
  <ScrollView scrollEventThrottle={0.0001} {...props} ref={ref} />
));

module.exports = (createAnimatedComponent(
  ScrollViewWithEventThrottle,
): $FlowFixMe);
