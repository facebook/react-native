/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';

const Image = require('../../Image/Image');
const createAnimatedComponent = require('../createAnimatedComponent');

import type {AnimatedComponentType} from '../createAnimatedComponent';

module.exports = (createAnimatedComponent((Image: $FlowFixMe), {
  collapsable: false,
}): AnimatedComponentType<
  React.ElementConfig<typeof Image>,
  React.ElementRef<typeof Image>,
>);
