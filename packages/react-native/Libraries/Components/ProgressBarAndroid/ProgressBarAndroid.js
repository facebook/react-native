/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import typeof UnimplementedViewType from '../UnimplementedViews/UnimplementedView';
import typeof ProgressBarAndroidNativeComponentType from './ProgressBarAndroidNativeComponent';

export type {ProgressBarAndroidProps} from './ProgressBarAndroid.android';

module.exports = (require('../UnimplementedViews/UnimplementedView'):
  | UnimplementedViewType
  | ProgressBarAndroidNativeComponentType);
