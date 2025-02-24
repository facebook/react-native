/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {HostComponent} from '../../../..';
import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';

import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{
  ...ViewProps,

  removeClippedSubviews?: ?boolean,
}>;

type NativeType = HostComponent<NativeProps>;

export default (codegenNativeComponent<NativeProps>(
  'AndroidHorizontalScrollContentView',
  {interfaceOnly: true},
): NativeType);
