/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof TTextInput from '../../Libraries/Components/TextInput/TextInput';
import typeof * as TmockComponent from '../mockComponent';
import typeof * as TMockNativeMethods from '../MockNativeMethods';

const mockComponent =
  jest.requireActual<TmockComponent>('../mockComponent').default;
const MockNativeMethods = jest.requireActual<TMockNativeMethods>(
  '../MockNativeMethods',
).default;

const TextInput = mockComponent(
  '../Libraries/Components/TextInput/TextInput',
  {
    ...MockNativeMethods,
    isFocused: jest.fn(),
    clear: jest.fn(),
    getNativeRef: jest.fn(),
  }, // instanceMethods
  true, // isESModule
) as TTextInput;

export default TextInput;
