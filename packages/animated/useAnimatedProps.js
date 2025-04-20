/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AnimatedPropsHook} from 'react-native/src/private/animated/createAnimatedPropsHook';

import createAnimatedPropsHook from 'react-native/src/private/animated/createAnimatedPropsHook';

/**
 * @deprecated
 */
export default createAnimatedPropsHook(null) as AnimatedPropsHook;
