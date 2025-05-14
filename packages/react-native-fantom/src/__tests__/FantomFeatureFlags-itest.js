/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags commonTestFlag:true jsOnlyTestFlag:true
 * @fantom_react_fb_flags testOnlyFlagNotUsedByReact:true
 */

/**
 * Please note that the code running the logic in this test is defined in the
 * docblock of this file (see the @fantom_flags and @fantom_react_fb_flags
 * directives above).
 */

import ReactNativeInternalFeatureFlags from 'ReactNativeInternalFeatureFlags';

import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

describe('FantomFeatureFlags', () => {
  it('allows overridding common feature flags', () => {
    expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(true);
  });

  it('allows overridding JS-only feature flags', () => {
    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
  });

  it('allows overriding Meta internal React Native => React flags', () => {
    expect(ReactNativeInternalFeatureFlags.testOnlyFlagNotUsedByReact).toBe(
      true,
    );
  });
});
