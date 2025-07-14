/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {HostComponent} from '../../src/private/types/HostComponent';
import typeof * as TmockNativeComponent from '../mockNativeComponent';

const mockNativeComponent = jest.requireActual<TmockNativeComponent>(
  '../mockNativeComponent',
).default;

export default function requireNativeComponent<T: {...}>(
  uiViewClassName: string,
): HostComponent<T> {
  return mockNativeComponent<T>(uiViewClassName);
}
