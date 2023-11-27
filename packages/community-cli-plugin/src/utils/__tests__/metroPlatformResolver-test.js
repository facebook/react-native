/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {CustomResolutionContext} from 'metro-resolver/src/types';

import {reactNativePlatformResolver} from '../metroPlatformResolver';

jest.dontMock('../metroPlatformResolver');

describe('reactNativePlatformResolver', () => {
  let resolveRequest = jest.fn();
  let metroContextMock: Partial<{...CustomResolutionContext}> = {
    customResolverOptions: {},
    resolveRequest,
  };
  beforeEach(() => {
    resolveRequest.mockReset();
  });

  test('forwards non react-native module', () => {
    reactNativePlatformResolver({visionos: 'react-native-visionos'})(
      // $FlowFixMe[incompatible-call]
      metroContextMock,
      'module-name',
      'ios',
    );

    expect(resolveRequest).toHaveBeenCalledWith(
      metroContextMock,
      'module-name',
      'ios',
    );
  });

  test('rewrites react-native module to out-of-tree platform "macos"', () => {
    reactNativePlatformResolver({macos: 'react-native-macos'})(
      // $FlowFixMe[incompatible-call]
      metroContextMock,
      'react-native',
      'macos',
    );

    expect(resolveRequest).toHaveBeenCalledWith(
      metroContextMock,
      'react-native-macos',
      'macos',
    );
  });

  test('rewrites internal react-native/Libraries/Utilities/Platform path to out-of-tree platform "macos"', () => {
    reactNativePlatformResolver({macos: 'react-native-macos'})(
      // $FlowFixMe[incompatible-call]
      metroContextMock,
      'react-native/Libraries/Utilities/Platform',
      'macos',
    );

    expect(resolveRequest).toHaveBeenCalledWith(
      metroContextMock,
      'react-native-macos/Libraries/Utilities/Platform',
      'macos',
    );
  });

  test('rewrites react-native module to out-of-tree variant "visionos" based on "ios" platform', () => {
    const metroContextMockWithVariant: Partial<{...CustomResolutionContext}> = {
      ...metroContextMock,
      customResolverOptions: {variant: 'visionos'},
    };
    reactNativePlatformResolver({visionos: 'react-native-visionos'})(
      // $FlowFixMe[incompatible-call]
      metroContextMockWithVariant,
      'react-native',
      'ios',
    );

    expect(resolveRequest).toHaveBeenCalledWith(
      metroContextMockWithVariant,
      'react-native-visionos',
      'ios',
    );
  });

  test('rewrites internal react-native/Libraries/Utilities/Platform path to out-of-tree variant "visionos" based on "ios" platform', () => {
    const metroContextMockWithVariant: Partial<{...CustomResolutionContext}> = {
      ...metroContextMock,
      customResolverOptions: {variant: 'visionos'},
    };
    reactNativePlatformResolver({visionos: 'react-native-visionos'})(
      // $FlowFixMe[incompatible-call]
      metroContextMockWithVariant,
      'react-native/Libraries/Utilities/Platform',
      'ios',
    );

    expect(resolveRequest).toHaveBeenCalledWith(
      metroContextMockWithVariant,
      'react-native-visionos/Libraries/Utilities/Platform',
      'ios',
    );
  });
});
