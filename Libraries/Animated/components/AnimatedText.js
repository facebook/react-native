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

const Text = require('../../Text/Text');
const createAnimatedComponent = require('../createAnimatedComponent');

import type {AnimatedComponentType} from '../createAnimatedComponent';

module.exports = (createAnimatedComponent(
  (Text: $FlowFixMe),
): AnimatedComponentType<
  React.ElementConfig<typeof Text>,
  React.ElementRef<typeof Text>,
>);
