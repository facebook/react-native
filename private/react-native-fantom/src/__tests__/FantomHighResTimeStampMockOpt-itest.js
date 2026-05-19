/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_mode opt
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';

describe('Fantom HighResTimeStamp mocks (optimized builds)', () => {
  it('does not allow mocking the time in optimized builds', () => {
    expect(() => Fantom.installHighResTimeStampMock()).toThrow(
      'Mocking timers is not supported in optimized builds',
    );
  });
});
