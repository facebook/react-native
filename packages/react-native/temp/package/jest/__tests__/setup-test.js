/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

import NativeExceptionsManager from '../../Libraries/Core/NativeExceptionsManager';

test('NativeExceptionsManager is a mock', () => {
  expect(jest.isMockFunction(NativeExceptionsManager.reportException)).toBe(
    true,
  );
});
