/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof TActivityIndicator from '../../Libraries/Components/ActivityIndicator/ActivityIndicator';
import typeof * as TmockComponent from '../mockComponent';

const mockComponent =
  jest.requireActual<TmockComponent>('../mockComponent').default;

const ActivityIndicator = mockComponent(
  '../Libraries/Components/ActivityIndicator/ActivityIndicator',
  null, // instanceMethods
  true, // isESModule
) as TActivityIndicator;

export default ActivityIndicator;
