/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const requireNativeComponent = require('requireNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {SyntheticEvent} from 'CoreEventTypes';
import type {NativeComponent} from 'ReactNative';

module.exports = requireNativeComponent('AndroidProgressBar');
