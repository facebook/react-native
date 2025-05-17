/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @fantom_flags commonTestFlag:true jsOnlyTestFlag:true
 */

import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

describe('FantomFeatureFlags', () => {
  it('allows overridding common feature flags', () => {
    expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(true);
  });

  it('allows overridding JS-only feature flags', () => {
    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
  });
});
