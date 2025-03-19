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

import typeof ProgressBarAndroidNativeComponentType from './ProgressBarAndroidNativeComponent';
import type {ProgressBarAndroidProps} from './ProgressBarAndroidTypes';

export type {ProgressBarAndroidProps};

export default require('../UnimplementedViews/UnimplementedView')
  .default as $FlowFixMe as component(
  ref?: React.RefSetter<
    React.ElementRef<ProgressBarAndroidNativeComponentType>,
  >,
  ...props: ProgressBarAndroidProps
);
