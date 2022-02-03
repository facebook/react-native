/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';

const View = require('../../Components/View/View');
const createAnimatedComponent = require('../createAnimatedComponent');

import type {AnimatedComponentType} from '../createAnimatedComponent';

module.exports = (createAnimatedComponent(View): AnimatedComponentType<
  React.ElementConfig<typeof View>,
  React.ElementRef<typeof View>,
>);
